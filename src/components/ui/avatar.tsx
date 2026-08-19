import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  online?: boolean;
}

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg' };

export function Avatar({ src, name, size = 'md', className, online }: AvatarProps) {
  return (
    <div className={cn('relative shrink-0', sizes[size], className)}>
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="rounded-full object-cover"
          sizes="64px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
          {getInitials(name)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white',
            online ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
      )}
    </div>
  );
}
