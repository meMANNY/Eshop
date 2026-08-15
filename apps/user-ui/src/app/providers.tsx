"use client";
import { WebSocketProvider } from '@/context/web-socket-context';
import useUser from '@/hooks/useUser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React,{useState} from 'react'


const Providers = ({children}:{children: React.ReactNode}) => {

    const [queryClient] = useState(()=> new QueryClient());
    //holds the data and saves it from re-rendering the component
    //causing the data to be lost and refetched again and again
    //also no module-level singleton is created for the query client,
    //  so we create it in the component and use useState to make sure it is only created once
    // and does not let user A data mingled with user B data
  return (
    <QueryClientProvider client={queryClient}>
      <ProviderWithWebSocket>
        {children}
      </ProviderWithWebSocket>
    </QueryClientProvider>
  )
}

const ProviderWithWebSocket = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  return (
    <>
      {user && <WebSocketProvider user={user}>{children}</WebSocketProvider>}
      {!user && children}
    </>
  );
};

export default Providers;

