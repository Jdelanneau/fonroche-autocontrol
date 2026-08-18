import type { SVGProps } from "react";

function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export const Icon = {
  Back: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M15 18l-6-6 6-6" />
    </Base>
  ),
  Plus: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={2.4} {...p}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  ),
  Check: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={3} {...p}>
      <path d="M20 6L9 17l-5-5" />
    </Base>
  ),
  Cross: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={3} {...p}>
      <path d="M18 6L6 18M6 6l12 12" />
    </Base>
  ),
  Chevron: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={2.4} {...p}>
      <path d="M6 9l6 6 6-6" />
    </Base>
  ),
  Camera: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={1.8} {...p}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
      <circle cx={12} cy={14} r={3.4} />
    </Base>
  ),
  Trash: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={1.8} {...p}>
      <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v13a1 1 0 01-1 1H8a1 1 0 01-1-1V7h10z" />
    </Base>
  ),
  Edit: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={1.8} {...p}>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </Base>
  ),
  Send: (p: SVGProps<SVGSVGElement>) => (
    <Base {...p}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </Base>
  ),
  Save: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={1.8} {...p}>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </Base>
  ),
  Pin: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={1.8} {...p}>
      <path d="M12 22s7-7.2 7-12.5A7 7 0 105 9.5C5 14.8 12 22 12 22z" />
      <circle cx={12} cy={9.5} r={2.3} />
    </Base>
  ),
  Mail: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={1.8} {...p}>
      <path d="M4 4h16v16H4V4z" />
      <path d="M22 6l-10 7L2 6" />
    </Base>
  ),
  Whatsapp: (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.1-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.5.1-.2 0-.4 0-.5C10.4 9 10 8 9.8 7.6c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.2-.1-.2-.3-.2-.6-.4z" />
      <path
        d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  ),
  Download: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={1.8} {...p}>
      <path d="M12 3v13m0 0l-4-4m4 4l4-4M4 21h16" />
    </Base>
  ),
  Users: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={1.8} {...p}>
      <path d="M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9.5 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </Base>
  ),
  LogOut: (p: SVGProps<SVGSVGElement>) => (
    <Base strokeWidth={1.8} {...p}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </Base>
  )
};
