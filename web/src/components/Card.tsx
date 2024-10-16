import { cn } from 'lib/helpers';

export default function Card({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'flex w-full flex-col gap-3 rounded-lg border border-neutral-200 bg-white text-sm shadow-md shadow-black/5',
        className,
      )}
      {...props}
    />
  );
}
