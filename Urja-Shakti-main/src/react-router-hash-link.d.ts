// src/react-router-hash-link.d.ts
declare module 'react-router-hash-link' {
    import * as React from 'react';
    import { LinkProps, NavLinkProps } from 'react-router-dom';
  
    export interface HashLinkProps extends LinkProps {
      smooth?: boolean;
      scroll?: (element: HTMLElement) => void;
      timeout?: number;
    }
  
    export interface NavHashLinkProps extends NavLinkProps {
      smooth?: boolean;
      scroll?: (element: HTMLElement) => void;
      timeout?: number;
    }
  
    export const HashLink: React.ForwardRefExoticComponent<
      HashLinkProps & React.RefAttributes<HTMLAnchorElement>
    >;
  
    export const NavHashLink: React.ForwardRefExoticComponent<
      NavHashLinkProps & React.RefAttributes<HTMLAnchorElement>
    >;
  }
  