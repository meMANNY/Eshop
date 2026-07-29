'use client';

import styled from 'styled-components';

// Full-height, sticky navigation column. Cool near-black (slate-900) to match the
// slate hover/idle states already used by SidebarItem, with a hairline right border.
export const SidebarWrapper = styled.div`
  position: sticky;
  top: 0;
  height: 100vh;
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #0f172a;
  color: #cbd5e1;
  border-right: 1px solid #1e293b;
  overflow: hidden;

  @media (max-width: 1024px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 202;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);

    &[data-open='true'] {
      transform: translateX(0);
    }
  }
`;

// Dimming backdrop shown behind the drawer on mobile. Hidden by default.
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 201;
  background: rgba(2, 6, 23, 0.6);
  backdrop-filter: blur(2px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;

  &[data-open='true'] {
    opacity: 1;
    pointer-events: auto;
  }

  @media (min-width: 1025px) {
    display: none;
  }
`;

// Brand row at the top, separated by a hairline.
export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  border-bottom: 1px solid #1e293b;

  svg {
    color: #ff6f61;
    flex-shrink: 0;
  }

  a {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: inherit;
  }
`;

// Scrollable middle region that holds the SidebarMenu groups. Scrollbar hidden.
export const Body = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 12px 24px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

// Pinned footer for the seller identity / sign-out, separated by a hairline.
export const Footer = styled.div`
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-top: 1px solid #1e293b;
  font-size: 14px;
`;

export const Sidebar = {
  Wrapper: SidebarWrapper,
  Header,
  Body,
  Overlay,
  Footer,
};
