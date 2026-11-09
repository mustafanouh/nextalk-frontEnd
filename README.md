# 💬 NexTalk — Frontend

The frontend of **NexTalk**, a real-time chat and video calling platform. Built with **Next.js 16**, **React 19**, and **TypeScript**, with live messaging through WebSockets and peer-to-peer calls through **WebRTC**.

**NexTalk = Next.js + Talk** 🚀

> Backend repository: `nextalk-backend` (Laravel)

---

## 💡 Core Idea

The project is more than pages and saved messages. The goal was to build real-time communication and understand what happens behind the scenes of a call:

```
Authentication → WebSocket → Signaling → SDP → ICE → WebRTC → Media Streams
```

---

## ✨ Features

- 🔐 Register, login, forgot/reset password, protected routes
- 💬 Real-time messaging (messages appear and get deleted instantly)
- 📎 File attachments with drag & drop
- 📞 Voice and video calls using WebRTC
- 🔔 Incoming call modal with ringtone
- 🎛️ Call controls: mute microphone, toggle camera, end call
- 👤 Profile editing and avatar
- 🔎 User search and starting conversations
- 🌍 Arabic and English support (next-intl)

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, class-variance-authority, lucide-react |
| Server State | TanStack React Query |
| Client State | Zustand |
| Forms & Validation | React Hook Form + Zod |
| Real-Time | Laravel Echo + pusher-js (Laravel Reverb) |
| Calls | WebRTC (native browser APIs) |
| i18n | next-intl (`ar`, `en`) |
| HTTP | Axios |
| File Upload | react-dropzone |

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── (auth)/          # login, register, forgot/reset password
│   └── (dashboard)/     # chat, calls, profile
├── features/
│   ├── auth/            # forms, hooks, schemas, ProtectedRoute
│   ├── conversations/   # list, item, header, view
│   ├── messages/        # composer, list, bubble, hooks
│   ├── attachments/     # AttachmentDropzone
│   ├── calls/
│   │   ├── webrtc/      # WebRTCService, useWebRTC, Ringtone
│   │   ├── providers/   # CallProvider
│   │   ├── hooks/       # useCallInternal
│   │   └── components/  # CallScreen, CallControls, CallVideo, IncomingCallModal, ...
│   └── users/           # profile form, user search
├── providers/           # AppProvider, QueryProvider, EchoProvider
├── stores/              # Zustand: auth, chat, call
├── components/          # shared UI, layout (Sidebar)
├── lib/                 # axios, echo, query-client, utils
├── types/               # shared TypeScript types
└── config/env.ts        # typed environment configuration
messages/                # en.json, ar.json translations
```

### Key design ideas

- **Feature-based architecture** — each domain owns its components, hooks, and API layer.
- **`WebRTCService`** — a class that wraps `RTCPeerConnection`, manages local/remote media streams, and **buffers ICE candidates** until the remote description is set.
- **`EchoProvider`** — manages the WebSocket connection and channel subscriptions (private user channel and call presence channel).
- **`CallProvider` + call store** — global call state so an incoming call can appear on any page.
- **React Query + WebSockets** — REST for initial data, WebSocket events to update the cache in real time.
- **Typed environment config** — fails fast in production when required variables are missing.
- **Configurable STUN/TURN** — ICE servers come from environment variables.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm or npm
- The NexTalk backend running (API + Reverb WebSocket server)

### Installation

```bash
pnpm install        # or: npm install
```

### Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
NEXT_PUBLIC_REVERB_APP_KEY=<your-reverb-app-key>

# ICE servers for WebRTC (TURN is recommended in production)
NEXT_PUBLIC_STUN_URL=stun:stun.l.google.com:19302
NEXT_PUBLIC_TURN_URL=
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_CREDENTIAL=
```

> None of these values are secrets. The Reverb app key is public by design, and the Sanctum token is stored per user after login.

### Run

```bash
pnpm dev            # http://localhost:3000
```

> 💡 Camera and microphone access require `localhost` or **HTTPS**.

### Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start the development server |
| `build` | Build for production |
| `start` | Run the production build |
| `lint` | Run ESLint |

---

## 📞 How a Call Works

1. The caller clicks the call button → `POST /conversations/{id}/calls`.
2. The callee receives an `IncomingCall` event over WebSocket and sees the incoming call modal.
3. The callee accepts → both sides create an `RTCPeerConnection`.
4. SDP offer/answer and ICE candidates are exchanged through the backend signaling endpoints.
5. A peer-to-peer connection is established and audio/video streams are displayed.

---

## 🧠 Lessons Learned

- Problems appeared in WebSocket connections, channel authorization, SDP, and ICE, and each one revealed another layer of how WebRTC works.
- The microphone issue turned out not to be about the microphone at all, which is why understanding the full flow matters more than patching symptoms.
- The difference between writing code and understanding what happens behind it.

---

## 🏷️ Tags

`#NexTalk` `#NextJS` `#React` `#TypeScript` `#WebRTC` `#WebSockets` `#LaravelEcho` `#TailwindCSS` `#RealTime` `#SoftwareEngineering`
