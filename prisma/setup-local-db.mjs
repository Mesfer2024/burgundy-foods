import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const prismaDir = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(prismaDir, "dev.db");
const db = new DatabaseSync(dbPath);

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "emailVerified" DATETIME,
  "image" TEXT,
  "password" TEXT,
  "role" TEXT NOT NULL DEFAULT 'SALES',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" DATETIME NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "CompanySetting" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "nameAr" TEXT NOT NULL DEFAULT 'مؤسسة برغندي للأغذية',
  "nameEn" TEXT NOT NULL DEFAULT 'Burgundy Foods Establishment',
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "tradeLicense" TEXT,
  "taxNumber" TEXT,
  "logoUrl" TEXT,
  "brandColor" TEXT DEFAULT '#7c1d34',
  "description" TEXT DEFAULT 'نعمل على تجهيز عملياتنا اللوجستية في الرياض لخدمة قطاع الجملة والتجزئة داخل المملكة.',
  "vatEnabled" BOOLEAN NOT NULL DEFAULT false,
  "defaultVatRate" REAL NOT NULL DEFAULT 15,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sku" TEXT,
  "internalSku" TEXT,
  "supplierSku" TEXT,
  "barcode" TEXT,
  "nameAr" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "weight" TEXT,
  "unitWeightGrams" INTEGER,
  "packSize" TEXT,
  "packsPerCarton" INTEGER,
  "unitsPerCarton" INTEGER,
  "cartonsPerPallet" INTEGER,
  "palletsPerContainer" INTEGER,
  "cartonsPerContainer" INTEGER,
  "minimumOrderQuantity" INTEGER,
  "originCountry" TEXT,
  "imageUrl" TEXT,
  "cartonPurchase" REAL NOT NULL DEFAULT 0,
  "cartonSale" REAL NOT NULL DEFAULT 0,
  "shippingCost" REAL NOT NULL DEFAULT 0,
  "customsCost" REAL NOT NULL DEFAULT 0,
  "totalCost" REAL NOT NULL DEFAULT 0,
  "marginPercent" REAL NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "supplierId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Supplier" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nameAr" TEXT NOT NULL,
  "nameEn" TEXT,
  "type" TEXT,
  "country" TEXT,
  "city" TEXT,
  "contactName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "taxNumber" TEXT,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT
);

CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "companyName" TEXT,
  "type" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "taxNumber" TEXT,
  "tradeLicense" TEXT,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT
);

CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "totalAmount" REAL NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" REAL NOT NULL,
  "totalPrice" REAL NOT NULL,
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "QuoteRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  "companyName" TEXT,
  "city" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "customerType" TEXT NOT NULL,
  "items" TEXT NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ContactMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "InventoryBatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "shipmentNumber" TEXT NOT NULL,
  "arrivalDate" DATETIME,
  "supplier" TEXT,
  "cartonQty" INTEGER NOT NULL DEFAULT 0,
  "packQty" INTEGER NOT NULL DEFAULT 0,
  "productionDate" DATETIME,
  "expiryDate" DATETIME,
  "batchNumber" TEXT,
  "warehouse" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "InventoryBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "category" TEXT,
  "amount" REAL NOT NULL,
  "description" TEXT,
  "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Quotation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "quotationNumber" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiryDate" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "notes" TEXT,
  "subtotalBeforeVat" REAL NOT NULL DEFAULT 0,
  "discountAmount" REAL NOT NULL DEFAULT 0,
  "vatRate" REAL NOT NULL DEFAULT 0,
  "vatAmount" REAL NOT NULL DEFAULT 0,
  "totalAmount" REAL NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "QuotationLine" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "quotationId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" REAL NOT NULL DEFAULT 0,
  "quantityType" TEXT NOT NULL DEFAULT 'carton',
  "unitPriceBeforeVat" REAL NOT NULL DEFAULT 0,
  "discountAmount" REAL NOT NULL DEFAULT 0,
  "lineTotalBeforeVat" REAL NOT NULL DEFAULT 0,
  "notes" TEXT,
  CONSTRAINT "QuotationLine_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "QuotationLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SalesOrder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "salesOrderNumber" TEXT NOT NULL,
  "quotationId" TEXT,
  "customerId" TEXT NOT NULL,
  "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expectedDeliveryDate" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "subtotalBeforeVat" REAL NOT NULL DEFAULT 0,
  "discountAmount" REAL NOT NULL DEFAULT 0,
  "vatRate" REAL NOT NULL DEFAULT 0,
  "vatAmount" REAL NOT NULL DEFAULT 0,
  "totalAmount" REAL NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "SalesOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SalesOrderLine" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "salesOrderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" REAL NOT NULL DEFAULT 0,
  "quantityType" TEXT NOT NULL DEFAULT 'carton',
  "unitPriceBeforeVat" REAL NOT NULL DEFAULT 0,
  "lineTotalBeforeVat" REAL NOT NULL DEFAULT 0,
  "notes" TEXT,
  CONSTRAINT "SalesOrderLine_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SalesOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DeliveryNote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "deliveryNoteNumber" TEXT NOT NULL,
  "salesOrderId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "warehouseName" TEXT,
  "deliveryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "driverName" TEXT,
  "vehiclePlate" TEXT,
  "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
  "receivedBy" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "DeliveryNote_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DeliveryNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DeliveryNoteLine" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "deliveryNoteId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" REAL NOT NULL DEFAULT 0,
  "quantityType" TEXT NOT NULL DEFAULT 'carton',
  "batchNumber" TEXT,
  "expiryDate" DATETIME,
  "notes" TEXT,
  CONSTRAINT "DeliveryNoteLine_deliveryNoteId_fkey" FOREIGN KEY ("deliveryNoteId") REFERENCES "DeliveryNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DeliveryNoteLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceNumber" TEXT NOT NULL,
  "salesOrderId" TEXT,
  "deliveryNoteId" TEXT,
  "customerId" TEXT NOT NULL,
  "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "subtotalBeforeVat" REAL NOT NULL DEFAULT 0,
  "discountAmount" REAL NOT NULL DEFAULT 0,
  "vatRate" REAL NOT NULL DEFAULT 0,
  "vatAmount" REAL NOT NULL DEFAULT 0,
  "totalAmount" REAL NOT NULL DEFAULT 0,
  "amountPaid" REAL NOT NULL DEFAULT 0,
  "balanceDue" REAL NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "Invoice_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Invoice_deliveryNoteId_fkey" FOREIGN KEY ("deliveryNoteId") REFERENCES "DeliveryNote" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "InvoiceLine" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" REAL NOT NULL DEFAULT 0,
  "quantityType" TEXT NOT NULL DEFAULT 'carton',
  "unitPriceBeforeVat" REAL NOT NULL DEFAULT 0,
  "lineTotalBeforeVat" REAL NOT NULL DEFAULT 0,
  "notes" TEXT,
  CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InvoiceLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PaymentReceipt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "receiptNumber" TEXT NOT NULL,
  "invoiceId" TEXT,
  "customerId" TEXT NOT NULL,
  "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "amount" REAL NOT NULL,
  "paymentMethod" TEXT NOT NULL DEFAULT 'bank_transfer',
  "bankAccount" TEXT,
  "referenceNumber" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "PaymentReceipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "PaymentReceipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "OrderAttachment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "relatedType" TEXT NOT NULL,
  "relatedId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileType" TEXT,
  "notes" TEXT,
  "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploadedBy" TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_internalSku_key" ON "Product"("internalSku");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_barcode_key" ON "Product"("barcode");
CREATE UNIQUE INDEX IF NOT EXISTS "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "SalesOrder_salesOrderNumber_key" ON "SalesOrder"("salesOrderNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryNote_deliveryNoteNumber_key" ON "DeliveryNote"("deliveryNoteNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentReceipt_receiptNumber_key" ON "PaymentReceipt"("receiptNumber");
CREATE INDEX IF NOT EXISTS "OrderAttachment_related_idx" ON "OrderAttachment"("relatedType", "relatedId");
`);

db.close();
console.log(`SQLite database is ready at ${dbPath}`);
