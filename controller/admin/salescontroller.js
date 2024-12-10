import scales from "../../models/salesSchema.js"
import Order from "../../models/orderSchema.js"
import cart from "../../models/cartSchema.js"
import coupon from "../../models/couponSchema.js"
import User from "../../models/userschema.js"


const load_SalesReport = async (req, res) => {
    try {
      if (req.session.isAdmin) {
        // Fetch the last 10 recent orders
        const recentOrders = await Order.find({})
        .sort({ createdOn: -1 }) // Match field name to your schema
        .limit(10)
        // .populate('user', 'username email') // Remove this since user is not part of the order schema
        .populate('orderItems.product', 'productname') // Assuming this is the correct reference
        .lean();
        
        const deliveryCharges = 50;
        
        const formattedOrders = recentOrders.map(order => ({
          orderId: order.orderId,
          orderDate: order.createdOn, // Use 'createdOn' from your schema
          userName: 'N/A', // Set this to 'N/A' or any other fallback, since there's no user field in the order
          totalAmount: order.totalPrice,
          finalAmount: order.finalAmount,
          couponApplied: order.couponApplied,
          netSales: order.finalAmount + deliveryCharges,
        }));
    
        const totalSalesCount = formattedOrders.length;
        const totalOrderAmount = formattedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalDiscountApplied = formattedOrders.reduce((sum, order) => sum + (order.couponApplied ? (order.totalAmount - order.finalAmount) : 0), 0); 
  
        res.render("admin/salesReport", {
          title: 'Admin sales Report',
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




  const generateSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, reportType} = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); 
  
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid start or end date' });
        }
        
        
        
        const orders = await Order.find({
            placedAt: { $gte: start, $lte: end }
        }).populate('user', 'username email')
          .populate('items.product', 'productname category')
          .sort({ placedAt: -1})
        
  
        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for the specified date range' });
        }
  
        
        const reportData = calculateReportData(orders);
  
        const deliveryCharges = 50;
        reportData.orders = orders.map(order => ({
            orderId: order.orderId,
            orderDate: order.placedAt,
            userName: order.user ? (order.user.username || order.user.email) : 'Unknown User',
            totalAmount: order.totalAmount,
            taxAmount: order.taxAmount, 
            deliveryCharges, 
            netSales: order.totalAmount - (order.discountAmount || 0) + order.taxAmount + 50,  
            items: order.items.map(item => ({
              productName: item.product ? item.product.productname : 'Unknown Product',
                quantity: item.quantity,
                unitPrice: item.price / item.quantity,
                offerPrice: item.discountAmount || item.price,
                lineTotal: (item.discountAmount || item.price) * item.quantity,
                discount: item.discountAmount || 0 
            })),
            subtotal: order.items.reduce((sum, item) => sum + ((item.discountAmount || item.price) * item.quantity), 0),
            couponCode: order.couponCode || null,
            couponDiscount: order.discountAmount || 0
        }));
  
       
        reportData.recentOrders = orders.slice(0, 5).map(order => ({
            orderId: order.orderId,
            date: order.placedAt.toISOString().split('T')[0],
            status: order.orderStatus
        }));
  
        
        reportData.totalSalesCount = orders.length;
        reportData.totalOrderAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        reportData.totalDiscountApplied = orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
  
  
       
        
        if (reportType === 'pdf') {
            const pdfBuffer = await generatePDFReport(reportData);
            res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
            res.contentType('application/pdf');
            return res.send(pdfBuffer);
        } else if (reportType === 'excel') {
            const excelBuffer = await generateExcelReport(reportData);
            res.setHeader(
              'Content-Disposition',
              'attachment; filename="sales_report.xlsx"'
          );
            res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(excelBuffer);
        } else {
            return res.json(reportData);
        }
  
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'An error occurred while generating the report', details: error.message });
    }
  };
  
  
  
  
  
  function generatePDFReport(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        let buffers = [];
  
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });
  
       
        doc.rect(0, 0, doc.page.width, 40).fill('#1a237e');
        doc.fontSize(16).fillColor('#FFFFFF')
           .text('SALES REPORT', 50, 12, { align: 'center' });
        
       
        doc.fontSize(10).fillColor('#000')
           .text(`Period: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`, 
                 50, 50, { align: 'right' });
  
       
        const summaryY = 70;
        const cardWidth = 158;
        const cardSpacing = 10;
        
        
        doc.rect(50, summaryY, cardWidth, 60).fill('#f8f9fa').stroke('#e0e0e0');
        doc.fontSize(12).fillColor('#666')
           .text('TOTAL SALES COUNT', 60, summaryY + 10);
        doc.fontSize(20).fillColor('#1a237e')
           .text(data.totalOrders.toString(), 60, summaryY + 30);
  
       
        doc.rect(50 + cardWidth + cardSpacing, summaryY, cardWidth, 60).fill('#f8f9fa').stroke('#e0e0e0');
        doc.fontSize(12).fillColor('#666')
           .text('TOTAL ORDER AMOUNT', 60 + cardWidth + cardSpacing, summaryY + 10);
        doc.fontSize(20).fillColor('#1a237e')
           .text(`${data.finalTotal.toFixed(2)}`, 60 + cardWidth + cardSpacing, summaryY + 30);
  
  
        const totalDISCOUNT = data.offerDiscount + data.totalCouponDiscount;
        doc.rect(50 + (cardWidth + cardSpacing) * 2, summaryY, cardWidth, 60).fill('#f8f9fa').stroke('#e0e0e0');
        doc.fontSize(12).fillColor('#666')
           .text('TOTAL DISCOUNT', 60 + (cardWidth + cardSpacing) * 2, summaryY + 10);
        doc.fontSize(20).fillColor('#2e7d32')  
           .text(`${totalDISCOUNT.toFixed(2)}`, 60 + (cardWidth + cardSpacing) * 2, summaryY + 30);
  
        doc.moveDown(4);
  
       
        data.orders.forEach((order, orderIndex) => {
            if (doc.y > 700) doc.addPage();
  
            
            const orderY = doc.y;
            
            doc.rect(50, orderY, 495, 35 + (order.items.length * 25) + (order.couponCode ? 75 : 50)).stroke('#000000');
            doc.moveTo(50, orderY + 35).lineTo(545, orderY + 35).stroke('#000000'); 
            
            
            doc.fontSize(10).fillColor('#333');
            doc.text(`Order ID: ${order.orderId}`, 60, orderY + 10);
            doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 200, orderY + 10);
            doc.text(`Time: ${new Date(order.orderDate).toLocaleTimeString()}`, 340, orderY + 10);
            doc.text(`Customer: ${order.userName}`, 60, orderY + 20);
  
            doc.moveDown(2);
  
          
            const tableTop = doc.y;
            
  
            doc.rect(50, tableTop, 495, 20).fill('#e3f2fd').stroke('#000000');
            
            doc.strokeColor('#000000').lineWidth(1)
               .moveTo(50, tableTop).lineTo(50, tableTop + 20).stroke() 
               .moveTo(545, tableTop).lineTo(545, tableTop + 20).stroke();
            
            doc.fontSize(9).fillColor('#1a237e');
            doc.text('PRODUCT', 60, tableTop + 6, { width: 200 });
            doc.text('QTY', 270, tableTop + 6, { width: 50, align: 'center' });
            doc.text('UNIT PRICE', 330, tableTop + 6, { width: 80, align: 'right' });
            doc.text('TOTAL', 420, tableTop + 6, { width: 80, align: 'right' });
  
            
            let currentY = tableTop + 20;
            order.items.forEach((item, index) => {
                
  
                doc.rect(50, currentY, 495, 25)
                .fill(index % 2 === 0 ? '#ffffff' : '#f5f5f5').stroke('#000000');
  
                   
  
                   doc.strokeColor('#000000').lineWidth(1)
                   .moveTo(50, currentY).lineTo(50, currentY + 25).stroke() 
                   .moveTo(545, currentY).lineTo(545, currentY + 25).stroke() 
                   .moveTo(50, currentY + 25).lineTo(545, currentY + 25).stroke();
  
                doc.fontSize(9).fillColor('#444');
                doc.text(item.productName, 60, currentY + 8, { width: 200 });
                doc.text(item.quantity.toString(), 270, currentY + 8, { width: 50, align: 'center' });
                doc.text(`${item.unitPrice.toFixed(2)}`, 330, currentY + 8, { width: 80, align: 'right' });
                doc.text(`${item.lineTotal.toFixed(2)}`, 420, currentY + 8, { width: 80, align: 'right' });
  
                currentY += 25;
            });
  
            
           
  
           doc.rect(50, currentY, 495, order.couponCode ? 75 : 50).fill('#f8f9fa').stroke('#000000');
            
          
            doc.fontSize(9).fillColor('#666');
            doc.text('Subtotal:', 350, currentY + 10, { width: 70, align: 'right' });
            doc.fillColor('#333')
               .text(`${order.subtotal.toFixed(2)}`, 420, currentY + 10, { width: 80, align: 'right' });
  
              
              doc.strokeColor('#000000').lineWidth(1)
              .moveTo(50, currentY).lineTo(50, currentY + 30).stroke()  
              .moveTo(545, currentY).lineTo(545, currentY + 30).stroke()
  
            if (order.couponCode) {
                doc.fillColor('#666')
                   .text(`Coupon Applied (${order.couponCode}):`, 350, currentY + 25, { width: 70, align: 'right' });
                doc.fillColor('#ff4444')
                   .text(`-${order.couponDiscount.toFixed(2)}`, 420, currentY + 25, { width: 80, align: 'right' });
                currentY += 15;
            }
            doc.fontSize(10).fillColor('#666')
               .text('Charges:', 350, currentY + 25, { width: 70, align: 'right' });
            doc.fillColor('#666')
               .text("50.00", 420, currentY + 25, { width: 80, align: 'right' });
  
               
               
  
            doc.moveDown(3);
            doc.strokeColor('#000000').lineWidth(1)
               .moveTo(50, currentY).lineTo(50, currentY + 35).stroke()  
               .moveTo(545, currentY).lineTo(545, currentY + 35).stroke()
  
            doc.fontSize(10).fillColor('#1a237e')
               .text('Total Amount:', 350, currentY + 40, { width: 70, align: 'right' });
            doc.fillColor('#1a237e')
               .text(`${order.totalAmount.toFixed(2)}`, 420, currentY + 40, { width: 80, align: 'right' });
  
               
  
            doc.moveDown(3);
            doc.strokeColor('#000000').lineWidth(1)
            .moveTo(50, currentY).lineTo(50, currentY + 55).stroke()  
            .moveTo(545, currentY).lineTo(545, currentY + 55).stroke()
  
            doc.strokeColor('#000000').lineWidth(0.8).moveTo(50, currentY + 55).lineTo(545, currentY + 55).stroke();
        });
  
        
        doc.fontSize(8).fillColor('#666')
           .text(`Generated on: ${new Date().toLocaleString()}`, 50, doc.page.height - 20, 
                { align: 'center', width: 495 });
  
        doc.end();
    });
  }
  
  
  function generateHr(doc, y) {
    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
  }
  
  
  
  
  
  
  async function generateExcelReport(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
  
    worksheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 15 }
    ];
  
    worksheet.addRows([
        { metric: 'Total Orders', value: data.totalOrders },
        { metric: 'Original Total', value: data.originalTotal },
        { metric: 'Offer Discount', value: data.offerDiscount },
        { metric: 'Total After Offers', value: data.afterOfferTotal },
        { metric: 'Coupon Discount', value: data.totalCouponDiscount },
        { metric: 'Final Total', value: data.finalTotal }
    ]);
  
    worksheet.addRow({ metric: '', value: '' }); 
    worksheet.addRow({ metric: 'Order Details', value: '' }).font = { bold: true };
  
    worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 15 },
        { header: 'Order Date', key: 'orderDate', width: 15 },
        { header: 'User Name', key: 'userName', width: 20 },
        { header: 'Product Name', key: 'productName', width: 30 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Unit Price', key: 'unitPrice', width: 15 },
        { header: 'Offer Price', key: 'offerPrice', width: 15 },
        { header: 'Line Total', key: 'lineTotal', width: 15 }
    ];
  
    
    data.orders.forEach(order => {
        order.items.forEach(item => {
            worksheet.addRow({
                orderId: order.orderId,
                orderDate: new Date(order.orderDate).toLocaleDateString(),
                userName: order.userName,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                offerPrice: item.offerPrice,
                lineTotal: item.lineTotal
            });
        });
    });
  
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
  
  
  
  function calculateReportData(orders) {
    let originalTotal = 0;
    let afterOfferTotal = 0;
    let totalCouponDiscount = 0;
    let finalTotal = 0;
  
    orders.forEach(order => {
        const originalOrderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const afterOfferOrderTotal = order.items.reduce((sum, item) => 
            sum + ((item.discountAmount || item.price) * item.quantity), 0);
        const couponDiscount = order.discountAmount || 0;
  
        originalTotal += originalOrderTotal;
        afterOfferTotal += afterOfferOrderTotal;
        totalCouponDiscount += couponDiscount;  
        finalTotal += order.totalAmount;
    });
  
    return {
        totalOrders: orders.length,
        originalTotal,
        offerDiscount: originalTotal - afterOfferTotal,
        afterOfferTotal,
        totalCouponDiscount,
        finalTotal: afterOfferTotal - totalCouponDiscount,
  
    };
  }
  


  const sales_Chart = async (req, res) => {
    try {
      const { chartType } = req.query; 

      let aggregationPipeline = [];

      if (chartType === 'yearly') {
        aggregationPipeline = [
          {
            $group: {
              _id: { $year: "$createdAt" },  
              orderCount: { $sum: 1 }
            }
          },
          {
            $project: {
              year: "$_id",
              orderCount: 1,
              _id: 0
            }
          },
          { $sort: { year: -1 } },  
          { $limit: 5 },  
          { $sort: { year: 1 } } 
        ];
      } else {
        
        aggregationPipeline = [
          {
            $group: {
              _id: { $month: "$createdAt" }, 
              orderCount: { $sum: 1 }
            }
          },
          {
            $project: {
              month: {
                $let: {
                  vars: {
                    monthsInString: [, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                  },
                  in: {
                    $arrayElemAt: ['$$monthsInString', '$_id']
                  }
                }
              },
              orderCount: 1,
              _id: 0
            }
          },
          { $sort: { _id: -1 } }, 
          { $limit: 5 },  
          { $sort: { _id: 1 } } 
        ];
      }

      
      const orderData = await Order.aggregate(aggregationPipeline);

      res.json(orderData);
    } catch (error) {
      console.error('Error fetching order data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};


export {
     load_SalesReport ,
     generateSalesReport,
     sales_Chart
    };
