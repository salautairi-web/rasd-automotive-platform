# RASD Step 27 — Production Completion & Operational Hardening

## الهدف

الانتقال من foundations إلى تشغيل إنتاجي متكامل مع الحفاظ على مبدأ استقلال كل `businessEntity`، وعدم تحويل Central ERP إلى operational master مشترك.

## المنجز حتى الآن

- إضافة `server/entityAccess.ts` لحماية القراءة والتغييرات التشغيلية حسب الكيان مع default-deny.
- تشديد `iam.authorize` لإزالة تجاوز `admin` المخفي؛ الإدارة المركزية لـIAM ما زالت محكومة بـ`requireAdmin`.
- تشديد Fleet على ملكية الكيان، الصلاحية، correlation ID، وسلوك replay لمفتاح idempotency.
- تشديد Rental Advanced على كامل القراءة والدورة التشغيلية للحجز/العقد/checkout/check-in/الوديعة/المخالفات/التأمين/الربحية ضمن الكيان.
- تحسين فحوص المراجع في عقد التأجير، المخالفات، وتحديثات checkout/check-in لتبقى entity-scoped.
- إضافة عقود التحقق من القيود المالية والأحداث المالية المشتركة، مع اختبارات pure-function للاتزان والعكس.
- توثيق معايير القبول الخاصة باستقلال الكيانات والاعتمادية والمحاسبة.

## نطاق التنفيذ المتبقي

### 1. Finance execution layer
- ربط الأحداث المالية المعتمدة من الوحدات التشغيلية بدفاتر الكيان المحلية.
- دعم AR/AP، التسويات البنكية، وإقفال الفترات كشرائح مستقلة.
- منع تعديل القيود المرحّلة؛ التصحيح عبر reversal + corrected entry.
- تمرير financial events إلى Central ERP للتجميع فقط.

### 2. Automotive operational closure
- إكمال دورة شراء/بيع المركبة من acquisition إلى inventory إلى sale/disposal.
- ربط تكاليف الاستيراد المركبة بالـlanded cost عند الحاجة دون كسر ملكية الكيان.
- تحسين دورة workshop job card → parts/labor → invoice → financial event.
- توحيد حالة المركبة بين sales, rental, workshop, fleet وفق حدود واضحة للمصدر المالك للحالة.

### 3. Rental & Fleet production slice
- إكمال lifecycle الحجز → العقد → checkout → rental → check-in → settlement.
- ربط الأضرار والمخالفات والتأمين والوديعة بالتسوية النهائية.
- دعم النقل بين المواقع داخل الكيان، مع سجل تدقيقي.
- تجهيز interfaces لمزودي GPS/Telematics دون ربط provider داخل domain core.

### 4. Integration reliability
- idempotent inbound/outbound commands.
- retries وdead-letter handling.
- webhook replay protection.
- health/readiness checks للتكاملات.
- correlation IDs عبر command/event chains.

### 5. Security & governance
- تعميم entity-scoped default-deny على بقية الوحدات التشغيلية.
- maker/checker للعمليات الحساسة.
- audit trail للقرارات المالية والتشغيلية والإدارية.
- MFA/step-up enforcement عندما تتطلب العملية حساسية أعلى.

### 6. Acceptance & QA
- اختبارات استقلال الكيانات.
- اختبارات المحاسبة المتوازنة وعدم قابلية التعديل بعد الترحيل.
- اختبارات idempotency والـreplay، بما فيها السباقات المتزامنة عند مستوى قاعدة البيانات.
- production build وTypeScript validation.
- فحص RTL desktop/mobile.

## مبدأ التنفيذ

كل feature يجب أن تُبنى كـ vertical slice: schema → procedure/service → event/command contract → UI → tests → documentation.

لا يسمح لأي Central ERP procedure بالوصول المباشر إلى operational tables لكيان آخر.

## Acceptance scenario

1. إنشاء كيانين مستقلين: Sales وRental.
2. إنشاء سجلات متشابهة أو متطابقة بالاسم في كل كيان.
3. تنفيذ عملية تشغيلية مستقلة في كل كيان.
4. ترحيل قيد محلي متوازن في كل كيان.
5. نشر financial event إلى المركز.
6. تنفيذ consolidation.
7. التأكد من عدم تغير أي local ledger وعدم ظهور operational records عبر scope غير مصرح به.
8. إعادة إرسال نفس event/command والتأكد من عدم إنشاء أثر مكرر.

## حالة التحقق الحالية

لم يتم حتى هذه النقطة إثبات `pnpm check`, `pnpm test`, أو `pnpm build` بواسطة CI لهذا الفرع؛ GitHub Actions لا يعرض workflow run مرتبطًا بآخر commit. لذلك تعتبر هذه البوابات غير محققة إلى أن تُنفذ فعليًا في بيئة المشروع.

## Definition of Done

- الوظيفة تعمل end-to-end ضمن حدود الكيان.
- authorization مفعّل على backend وليس الواجهة فقط.
- جميع mutations الحساسة idempotent.
- يوجد audit/event trail قابل للتتبع.
- TypeScript وtests وproduction build تمر بنجاح في بيئة المشروع.
- الوثائق والـchangelog محدثة.
