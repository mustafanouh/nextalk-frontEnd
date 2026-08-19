# NexTalk — Frontend

مشروع Next.js حقيقي وشغال 100% (اتعمله `npm run build` + `tsc --noEmit` +
`eslint` من غير أي أخطاء) — مش مجرد كود. مبني فوق الباك اند اللي عملناه
قبل كده من غير أي تعديل عليه.

## 1. التركيب

```bash
cd nextalk-frontend
npm install
cp .env.example .env.local
```

عدّل `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
NEXT_PUBLIC_REVERB_APP_KEY=  # نفس REVERB_APP_KEY في .env بتاع الباك اند
```

## 2. التشغيل

```bash
npm run dev
```

بيفتح على `http://localhost:3000` وبيعمل redirect لـ `/chat`.

---

## ⚠️ إضافة مطلوبة على الباك اند قبل ما الـ real-time يشتغل

الفرونت اند (`src/lib/echo.ts`) بيحتاج route لـ Sanctum يوثق الاشتراك في
private/presence channels: `POST /broadcasting/auth`. المشروع بيستخدم
Bearer token (مش SPA cookies)، فمحتاج route بالـ `api` middleware مش
الافتراضي اللي بيسجله Laravel على الـ `web` middleware. ضيف في
`routes/api.php` بتاع الباك اند جوه الـ `Route::middleware('auth:sanctum')`
group الموجود بالفعل:

```php
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);
```

من غيره، أي محاولة اشتراك في `private-user.{id}` أو `presence-call.{id}`
هترجع 401/419.

---

## 3. البنية (زي الخطة بالظبط)

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/              login, register, forgot/reset password
│   └── (dashboard)/         chat, chat/[conversationId], calls, profile
├── features/                # كل ميزة معزولة: api/ components/ hooks/ types/
│   ├── auth/ users/ conversations/ messages/ attachments/ calls/
├── components/               ui/ (Button, Input, Avatar...) + layout/ + shared/
├── stores/                   auth.store, chat.store, call.store (Zustand)
├── providers/                QueryProvider, EchoProvider, AppProvider
├── lib/                       axios.ts, echo.ts, query-client.ts, utils.ts
├── types/                     api, auth, user, conversation, message
└── config/env.ts
```

**Rule 1 اتنفذت بالكامل**: مفيش أي Component بيستدعي axios مباشرة — كل حاجة
بتعدي عن طريق hook → api function.

## 4. اللي اتعمل (شغال فعليًا، متبني عليه)

- **Auth كامل**: login/register/logout/forgot/reset، Zod validation،
  persist session، 401 handling عالمي (`AppProvider` بيسمع لـ event من axios
  interceptor ويعمل logout تلقائي + redirect لـ `/login`)
- **Users**: بحث بـ debounce (350ms)، تحديث بروفايل بما فيه رفع avatar
- **Conversations**: قائمة + بحث + بدء محادثة جديدة (الباك اند بيمنع التكرار
  فمفيش داعي لمنطق إضافي في الفرونت)
- **Messages**: infinite scroll (تحميل الأقدم عند الوصول لأعلى القائمة عن
  طريق IntersectionObserver)، **optimistic send** (الرسالة تظهر فورًا بحالة
  "جاري الإرسال" وتتأكد لما الرد يوصل، أو تتحول لـ "فشل" لو حصل خطأ)، حذف
  رسالة بـ confirm dialog
- **Real-time**: `EchoProvider` مركزي واحد بيوزع الأحداث على TanStack Query
  cache مباشرة (`setQueryData`) من غير أي refetch كامل — بالظبط زي المطلوب
  في section 11 من خطتك
- **Attachments**: react-dropzone، validation (نوع + حجم)، preview، progress
  bar حقيقي عن طريق axios `onUploadProgress`
- **Calls + WebRTC**: `WebRTCService` (class خالص، مفيش RTCPeerConnection في
  أي state)، `useWebRTC` بيربطه بـ React عن طريق refs، `useCall` بيدير دورة
  الحياة كاملة (start → ringing → accept → offer/answer/ICE → connected →
  end) عن طريق presence channel، UI كامل (IncomingCallModal, CallScreen,
  CallControls, Local/RemoteVideo) شغالة للصوت والفيديو مع تنظيف الكاميرا/
  الميكروفون عند الإنهاء

## 5. حاجات مش مكتملة / قرارات محتاجة منك (بصراحة تامة)

1. **تحديد مين الـ caller ومين الـ callee** في `useCallInternal.ts` (اللي
   بيقرر مين يعمل `createOffer`) بيعتمد حاليًا على `callState` وقت الـ
   `joining` event بدل ما يبقى صريح (مثلاً عن طريق حفظ role صريح في
   `call.store.ts`) — شغال في الحالة العادية بس مش أنضف حل ممكن.
2. **Testing (Vitest / RTL / Playwright)**: مذكورة في phase 16 بخطتك، لسه
   معمولتش خالص.
3. **shadcn/ui الحقيقي**: بنيت UI kit يدوي بنفس الـ API تقريبًا (Button,
   Input, Avatar...) لأن الشبكة هنا معندهاش وصول لـ shadcn registry.
   لو عايزها فعلاً shadcn، شغّل `npx shadcn@latest init` عندك محليًا
   وهيشتغل عادي.
4. **صفحة `/calls` كسجل مكالمات حقيقي**: الباك اند مفيهوش endpoint لسجل
   المكالمات عبر كل المحادثات (`GET /api/calls`)، فالصفحة حاليًا بتعرض
   جهات الاتصال بس. لو عايز سجل حقيقي بالتواريخ والمدة، محتاجين نضيف
   endpoint جديد في الباك اند.

> **ملحوظة**: مشكلة تكرار الـ `useCall` subscription (كل component كان
> بيعمل presence-channel join منفصل) **اتصلحت** — دلوقتي `CallProvider`
> (في `features/calls/providers/CallProvider.tsx`) بيلف الـ `useCallInternal()`
> مرة واحدة بس في `(dashboard)/layout.tsx`، وكل المكونات بتستهلك نفس
> الـ instance عن طريق `useCall()` (context hook).

## 6. الخطوة الجاية

قولّي لو عايز:
1. الـ testing setup (Vitest + Playwright)
2. تصريح role الـ caller/callee بشكل أوضح في call store
3. أي تعديل أو مراجعة لجزء معين
