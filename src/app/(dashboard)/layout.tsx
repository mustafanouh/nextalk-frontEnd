import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { CallProvider } from '@/features/calls/providers/CallProvider';
import { IncomingCallModal } from '@/features/calls/components/IncomingCallModal';
import { CallScreen } from '@/features/calls/components/CallScreen';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {/* CallProvider mounts useCall() exactly once here — every descendant
          (Sidebar, chat pages, IncomingCallModal, CallScreen) shares this
          single instance instead of each creating its own presence-channel
          subscription. See CallProvider.tsx for why that matters. */}
      <CallProvider>
        <div className="flex h-screen w-full overflow-hidden bg-white">
          <Sidebar />
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>

        {/* Rendered once here so an incoming/active call surfaces regardless
            of which dashboard page the user is currently on. */}
        <IncomingCallModal />
        <CallScreen />
      </CallProvider>
    </ProtectedRoute>
  );
}
