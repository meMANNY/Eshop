import SidebarWrapper from "@/shared/components/sidebar/sidebar";
import React from "react";


const layout = ({ children }: { children: React.ReactNode }) => {
    return (
    <div className="flex h-full bg-black min-h-screen">
        {/*sidebar*/}
        <aside className=" w-[280px] min-w-[250px] max-w-[300px] border-r-slate-800 text-white p-4">
            <div className="sticky top-0">
                <SidebarWrapper/>
            </div>
        </aside>
        {children}
        </div>
    );
}

export default layout;