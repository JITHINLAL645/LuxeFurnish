import Order from "../../models/orderSchema.js";
import Coupon from "../../models/couponSchema.js";
import PdfPrinter from "pdfmake";
import ExcelJS from "exceljs";
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';
import { format } from "date-fns"; 
import express from 'express';
import pdfMake  from 'pdfmake';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const load_SalesReport = async (req, res) => {
  try {
    if (req.session.isAdmin) {
      
      const recentOrders = await Order.find({})
        .sort({ createdOn: -1 })
        .limit(10)
        .populate("orderItems.product", "productname") 
        .lean();

      const deliveryCharges = 50; 

      const formattedOrders = recentOrders.map((order) => ({
        orderId: order.orderId,
        orderDate: order.createdOn,
        orderItems: order.orderItems.map((item) => ({
          product: item.product.productname, 
          quantity: item.quantity,
        })),
        totalAmount: order.totalPrice,
        finalAmount: order.finalAmount,
        couponApplied: order.couponApplied,
        netSales: order.finalAmount + deliveryCharges, 
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


const fonts = {
  Roboto: {
    normal: path.join(__dirname, 'fonts/Roboto-Regular.ttf'),
    bold: path.join(__dirname, 'fonts/Roboto-Bold.ttf'),
  },
};
const printer = new PdfPrinter(fonts);

const formatAddress = (address) => {
  return `${address.firstName} ${address.lastName}\n${address.addressLine}\n${address.city}, ${address.district}, ${address.state}\n${address.country} - ${address.pincode}\nPhone: ${address.phoneNumber}\nAlt Phone: ${address.altPhoneNumber}\nEmail: ${address.email}`;
};
//---------
// Helper to generate PDF report




const generatePDFReport = (orders) => {
  const tableBody = [
    ['DATE', 'PRODUCT NAME', 'QUANTITY', 'TOTAL SALES', 'DISCOUNT', 'NET SALES'] // Adjusted header
  ];

  orders.forEach((order) => {
    // Calculate total quantity and net sales for the order
    const totalQuantity = order.orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalSales = order.totalPrice || 0;
    const discount = order.couponApplied ? totalSales - order.finalAmount : 0;
    const netSales = totalSales - discount;

    // Add each product's details to the table body
    order.orderItems.forEach((item) => {
      tableBody.push([ 
        format(order.createdOn, 'dd/MM/yyyy'),
        item.product.productname,  // Product name
        item.quantity,             // Product quantity
        `₹${totalSales.toFixed(2)}`, // Total sales
        `₹${discount.toFixed(2)}`,   // Discount applied
        `₹${netSales.toFixed(2)}`    // Net sales after discount
      ]);
    });
  });

  const table = {
    table: {
      headerRows: 1,
      widths: [80, 80, 80, 80, 80, 80],  // Adjust column widths for product name
      body: tableBody
    },
    layout: 'lightHorizontalLines',
  };

  const docDefinition = {
    content: [
      {
        text: 'Order Report', 
        style: 'header',
        alignment: 'left',
      },
      {
        text: 'LuxeFurnish',
        style: 'header',
        alignment: 'right',
      },
      table
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 10, 0, 10]
      }
    },
    defaultStyle: {
      font: 'Roboto',
    },
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [20, 20, 20, 20]
  };

  return printer.createPdfKitDocument(docDefinition);
};




const generateExcelReport = (orders) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sales Report");

  // Define columns to match the PDF format
  sheet.columns = [
    { header: "Order ID", key: "orderId" },
    { header: "Order Date", key: "orderDate" },
    { header: "Product Name", key: "productName" },
    { header: "Quantity", key: "quantity" },
    { header: "Total Sales", key: "totalSales" },
    { header: "Discount", key: "discount" },
    { header: "Net Sales", key: "netSales" }
  ];

  // Loop through orders and add details to the sheet
  orders.forEach((order) => {
    // Calculate the total sales, discount, and net sales for the order
    const totalSales = order.totalPrice || 0;
    const discount = order.couponApplied ? totalSales - order.finalAmount : 0;
    const netSales = totalSales - discount;

    order.orderItems.forEach((item) => {
      sheet.addRow({
        orderId: order.orderId,
        orderDate: format(order.createdOn, "yyyy-MM-dd"),
        productName: item.product.productname || 'Unknown Item',  // Ensure the product name is available
        quantity: item.quantity,
        totalSales: `₹${totalSales.toFixed(2)}`,
        discount: `₹${discount.toFixed(2)}`,
        netSales: `₹${netSales.toFixed(2)}`
      });
    });
  });

  // Return the workbook object for further handling or saving
  return workbook;
};






const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, reportType } = req.body;

    if (!startDate || !endDate || !reportType) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const orders = await filterOrdersByDate(startDate, endDate);

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
