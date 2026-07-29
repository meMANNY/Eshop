'use client';
import useSeller from "@/hooks/useSeller";
import useSidebar from "@/hooks/useSidebar";
import { usePathname } from "next/navigation";
import Box from "../box";
import React, { useEffect } from "react";
import Link from "next/link";
import Logo from "@/assests/logo";

import { Sidebar } from "./sidebar.styles";
import SidebarItem from "./sidebar.item";
import HomeIcon from "@/assests/icons/home";
import SidebarMenu from "./sidebar.menu";
import { ListOrdered, PackageSearch, SquarePlus,CalendarPlus, BellPlus, Mail, Settings, BellRing, TicketPercent, LogOut  } from "lucide-react";
import PaymentIcon from "@/assests/icons/payment";

const SidebarBarWrapper = ()=>{

    const {activeSidebar,setActiveSidebar} = useSidebar();
    const pathName = usePathname();
    const {seller} = useSeller();

    useEffect(()=>{
        
        setActiveSidebar(pathName)
    },[pathName,setActiveSidebar])

    const getIconColor = (route: string) => {
        activeSidebar === route ? "text-primary" : "text-slate-300"
    }
    return (
        <Box css={{
            height: "100vh",
            zIndex: 202,
            position: "sticky",
            padding:"8px",
            top:"0",
            overflowY: "scroll",
            scrollbarWidth: "none"
            
        }}
        className="sidebar-wrapper">
            <Sidebar.Header>
                <Box>
                    <Link href="/" className="flex justify-center text-center gap-2">
                        <Logo/>
                        <Box>
                            <h3 className="text-xl font-medium text-[#ecedee]">
                                {seller?.shop?.name}
                            </h3>
                            <h5 className="font-medium text-xs pl-2 text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                                {seller?.shop?.address}

                            </h5>
                        </Box>
                    </Link>
                    
                </Box>
            </Sidebar.Header>
            <div className="block my-3 h-full">
                <Sidebar.Body className="body sidebar">
                    <SidebarItem
                    title="Dashboard"
                    icon = {<HomeIcon/>}
                    isActive = {activeSidebar === "/dashboard"}
                    href="/dashboard"
                    />
                    <div className="mt-2 block">
                        <SidebarMenu title="Main Menu">
                            <SidebarItem
                            title="Orders"
                            icon = {<ListOrdered size = {20} />}
                            isActive = {activeSidebar === "/dashboard/orders"}
                            href="/dashboard/orders"
                            />
                            <SidebarItem
                            title="Payments"
                            icon = {<PaymentIcon />}
                            isActive = {activeSidebar === "/dashboard/payments"}
                            href="/dashboard/payments"
                            />
                        </SidebarMenu>
                        <SidebarMenu title = "Products">
                            <SidebarItem
                            title="Create Product"
                            icon = {<SquarePlus size = {20} />}
                            isActive = {activeSidebar === "/dashboard/create-product"}
                            href="/dashboard/create-product"
                            />
                            <SidebarItem
                            title="All Products"
                            icon = {< PackageSearch size={20}/>}
                            isActive = {activeSidebar === "/dashboard/all-products"}
                            href="/dashboard/all-products"
                            />
                        </SidebarMenu>
                        <SidebarMenu title="Events">
                            <SidebarItem
                            title = "Create Event"
                            icon = {< CalendarPlus size={20} />}
                            isActive = {activeSidebar === "/dashboard/create-event"}
                            href = "/dashboard/create-event"
                            />
                            <SidebarItem
                            title = "All Events"
                            icon = {<BellPlus size={20}/>}
                            isActive = {activeSidebar === "/dashboard/all-events"}
                            href = "/dashboard/all-events"
                            />
                        </SidebarMenu>
                        <SidebarMenu title = "Controllers">
                            <SidebarItem
                            title = "Inbox"
                            icon = {<Mail size = {20}/>}
                            isActive = {activeSidebar === "/dashboard/inbox"}
                            href="/dashboard/inbox"
                            />
                            <SidebarItem
                            title = "Settings"
                            icon = {<Settings size = {20}/>}
                            isActive = {activeSidebar === "/dashboard/settings"}
                            href="/dashboard/settings"
                            />
                            <SidebarItem
                            title = "Notifications"
                            icon = {<BellRing size = {20}/>}
                            isActive = {activeSidebar === "/dashboard/notifications"}
                            href="/dashboard/notifications"
                            />
                        </SidebarMenu>
                        <SidebarMenu title = "Extras">
                            <SidebarItem
                            title = "Discount Codes"
                            icon = {<TicketPercent size = {20}/>}
                            isActive = {activeSidebar === "/dashboard/discount-codes"}
                            href="/dashboard/discount-codes"
                            />
                            <SidebarItem
                            title = "Logout"
                            icon = {<LogOut size = {20}/>}
                            isActive = {activeSidebar === "/dashboard/logout"}
                            href="/dashboard/logout"
                            />
                        </SidebarMenu>
                    </div>
                </Sidebar.Body>
            </div>
        </Box>
    );
}

export default SidebarBarWrapper;