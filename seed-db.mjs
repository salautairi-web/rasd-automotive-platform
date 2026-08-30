import { createConnection } from "mysql2/promise";

const db = await createConnection(process.env.DATABASE_URL);
await db.query("INSERT IGNORE INTO organizations (code, nameAr, nameEn) VALUES ('RASD', 'شركة رصد للتجارة والاستثمار', 'RASD Trading & Investment')");
await db.query("INSERT IGNORE INTO branches (organizationId, code, nameAr, nameEn, city) SELECT id, 'MCT', 'فرع مسقط', 'Muscat Branch', 'مسقط' FROM organizations WHERE code='RASD'");
await db.query("INSERT IGNORE INTO business_units (organizationId, code, nameAr, nameEn, systemKey) SELECT id, 'SALES', 'مبيعات المركبات', 'Auto Sales', 'sales' FROM organizations WHERE code='RASD'");
await db.query("INSERT IGNORE INTO permissions (permissionKey, labelAr, systemKey) VALUES ('integration.read', 'عرض مركز التكامل', 'integration'), ('integration.write', 'إدارة الأحداث', 'integration'), ('master-data.read', 'عرض السجلات الرئيسية', 'master-data')");
await db.query("INSERT IGNORE INTO numbering_rules (organizationId, entityKey, prefix, includeYear, sequence) SELECT id, 'customer', 'CUS', 1, 0 FROM organizations WHERE code='RASD'");
await db.query("INSERT IGNORE INTO numbering_rules (organizationId, entityKey, prefix, includeYear, sequence) SELECT id, 'vehicle', 'VH', 1, 0 FROM organizations WHERE code='RASD'");
await db.query("INSERT IGNORE INTO numbering_rules (organizationId, entityKey, prefix, includeYear, sequence) SELECT id, 'product', 'PRD', 1, 0 FROM organizations WHERE code='RASD'");
await db.end();
console.log("RASD Phase 1 seed complete");
