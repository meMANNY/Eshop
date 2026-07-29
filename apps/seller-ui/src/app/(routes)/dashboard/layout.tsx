
import React from "react";
import SidebarBarWrapper from "@/shared/components/sidebar/sidebar";


const layout = ({ children }: { children: React.ReactNode }) => {
    return (
    <div className="flex h-full bg-black min-h-screen">
        {/*sidebar*/}
        <aside className=" w-[280px] min-w-[250px] max-w-[300px] border-r-slate-800 text-white p-4">
            <div className="sticky top-0">
                <SidebarBarWrapper/>
            </div>
        </aside>
        {children}
        </div>
    );
}

export default layout;