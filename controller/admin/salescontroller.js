import Order from "../../models/orderSchema.js";
import PdfPrinter from "pdfmake";
import ExcelJS from "exceljs";
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';
import { format } from "date-fns"; // For date formatting
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const load_SalesReport = async (req, res) => {
  try {
    if (req.session.isAdmin) {
      // Fetch the recent 10 orders
      const recentOrders = await Order.find({})
        .sort({ createdOn: -1 })
        .limit(10)
        .populate("orderItems.product", "productName") // Assuming 'productName' is a field in Product schema
        .lean();

      const deliveryCharges = 50; // Assuming a flat rate of delivery charges, adjust as needed

      const formattedOrders = recentOrders.map((order) => ({
        orderId: order.orderId,
        orderDate: order.createdOn,
        orderItems: order.orderItems.map((item) => ({
          product: item.product.productName, // Assuming product has a 'productName' field
          quantity: item.quantity,
        })),
        totalAmount: order.totalPrice,
        finalAmount: order.finalAmount,
        couponApplied: order.couponApplied,
        netSales: order.finalAmount + deliveryCharges, // Adjust as needed
      }));

      const totalSalesCount = formattedOrders.length;
      const totalOrderAmount = formattedOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );
      const totalDiscountApplied = formattedOrders.reduce(
        (sum, order) =>
          sum + (order.couponApplied ? order.totalAmount - order.finalAmount : 0),
        0
      );

      res.render("admin/salesReport", {
        title: "Admin Sales Report",
        recentOrders: formattedOrders,
        totalSalesCount,
        totalOrderAmount,
        totalDiscountApplied,
        deliveryCharges,
      });
    } else {
      res.redirect("/admin/loadAdminDash");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "An error occurred" });
  }
};

// Helper to filter orders by date
const filterOrdersByDate = async (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const orders = await Order.find({
    createdOn: {
      $gte: start,
      $lte: end,
    },
  }).populate("user")
    .populate("orderItems.product");

  return orders;
};

// Define fonts
const fonts = {
  Roboto: {
    normal: path.join(__dirname, 'fonts/Roboto-Regular.ttf'),
    bold: path.join(__dirname, 'fonts/Roboto-Bold.ttf'),
  },
};
const printer = new PdfPrinter(fonts);

// Helper function to format address
const formatAddress = (address) => {
  return `${address.firstName} ${address.lastName}\n${address.addressLine}\n${address.city}, ${address.district}, ${address.state}\n${address.country} - ${address.pincode}\nPhone: ${address.phoneNumber}\nAlt Phone: ${address.altPhoneNumber}\nEmail: ${address.email}`;
};
//---------
// Helper to generate PDF report
const generatePDFReport = (orders) => {
  const content = [];

  // Loop through each order and create sections
  orders.forEach((order) => {
    const orderItems = order.orderItems.map((item, index) => ({
      text: `Item ${index + 1}: ${item.name}, Quantity: ${item.quantity}, Price: ₹${item.price}`,
      margin: [0, 5, 0, 5],
    }));

    content.push(
      { text: `Order ID: ${order.orderId}`, style: 'header', margin: [0, 10, 0, 5] },
      { text: `Date: ${format(order.createdOn, 'yyyy-MM-dd HH:mm:ss')}`, margin: [0, 5, 0, 15] },
      { text: 'Customer Details:', style: 'subheader' },
      { text: formatAddress(order.address), margin: [0, 5, 0, 10] },
      { text: 'Order Items:', style: 'subheader' },
      ...orderItems,
      { text: `Total Price: ₹${order.totalPrice}`, bold: true, margin: [0, 5, 0, 5] },
      { text: `Final Amount: ₹${order.finalAmount}`, bold: true, margin: [0, 5, 0, 5] },
      { text: `Order Status: ${order.status}`, bold: true, margin: [0, 10, 0, 15] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 595, y2: 0, lineWidth: 1 }] } // Adds a horizontal line
    );
  });

  // Define the PDF document
  const docDefinition = {
    content: content,
    styles: {
      header: {
        fontSize: 16,
        bold: true,
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
      },
    },
    defaultStyle: {
      font: 'Roboto',
    },
  };

  return printer.createPdfKitDocument(docDefinition);
};

// Helper to generate Excel report
const generateExcelReport = (orders) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sales Report");

  sheet.columns = [
    { header: "Order ID", key: "orderId" },
    { header: "Order Date", key: "orderDate" },
    { header: "Product", key: "productName" },
    { header: "Quantity", key: "quantity" },
    { header: "Total Amount", key: "totalAmount" },
    { header: "Coupon Applied", key: "couponApplied" },
  ];

  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      sheet.addRow({
        orderId: order.orderId,
        orderDate: format(order.createdOn, "yyyy-MM-dd"),
        productName: item.product.productName,
        quantity: item.quantity,
        totalAmount: order.totalPrice,
        couponApplied: order.couponApplied ? "Yes" : "No",
      });
    });
  });

  return workbook;
};

// Endpoint for generating reports (PDF or Excel)
const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, reportType } = req.body;

    // Validate required fields
    if (!startDate || !endDate || !reportType) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const orders = await filterOrdersByDate(startDate, endDate);

    // Generate report based on reportType
    if (reportType === "pdf") {
      const pdfDoc = generatePDFReport(orders);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="sales_report_${Date.now()}.pdf"`);
      pdfDoc.pipe(res);
      pdfDoc.end();
    } else if (reportType === "excel") {
      const workbook = generateExcelReport(orders);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="sales_report_${Date.now()}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate report" });
  }
};



const generateSalesReportController = (req, res) => {
  const { startDate, endDate, reportType } = req.body;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validate the date range
  if (start > end) {
      return res.status(400).send('Invalid date range');
  }

  // Filter orders based on the selected date range
  const filteredOrders = recentOrders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= start && orderDate <= end;
  });

  // Log filtered orders to verify if the filtering works
  console.log(filteredOrders);

  if (reportType === 'excel') {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

      // Define columns for the Excel sheet
      worksheet.columns = [
          { header: 'Order ID', key: 'orderId' },
          { header: 'Order Date', key: 'orderDate' },
          { header: 'Total Amount', key: 'totalAmount' },
          { header: 'Net Sales', key: 'netSales' }
      ];

      // Ensure that the filtered orders are added correctly to the Excel sheet
      filteredOrders.forEach(order => {
          worksheet.addRow({
              orderId: order.orderId,
              orderDate: order.orderDate,
              totalAmount: order.totalAmount,
              netSales: order.netSales
          });
      });

      // Set headers for the response to download the Excel file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

      // Write the Excel file and end the response
      workbook.xlsx.write(res).then(() => {
          res.end();
      });
  } else {
      res.status(400).send('Invalid report type');
  }
};



export { 
  load_SalesReport,
   generateSalesReport,
   generateSalesReportController
   };
