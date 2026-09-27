import { cn } from 'cn';

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      // Clear Night keycap (DESIGN.md §11.4, PRIMITIVES.md P-KBD): one theme keycap everywhere, styled by
      // shell.css .at-kbd (tokens only); it never inherits the button or text it sits in.
      className={cn('at-kbd pointer-events-none select-none', "[&_svg:not([class*='size-'])]:size-3", className)}
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <kbd data-slot="kbd-group" className={cn('inline-flex items-center gap-1', className)} {...props} />;
}

export { Kbd, KbdGroup };
