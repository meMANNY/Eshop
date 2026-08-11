
import React from "react";
import SidebarBarWrapper from "@/shared/components/sidebar/sidebar";


const layout = ({ children }: { children: React.ReactNode }) => {
    return (
    <div className="flex h-full bg-black min-h-screen">
        {/*sidebar*/}
        <aside className=" w-[280px] min-w-[250px] max-w-[300px] shrink-0 border-r border-r-slate-800 text-white p-4">
            <div className="sticky top-0">
                <SidebarBarWrapper/>
            </div>
        </aside>
        {/* Without flex-1 a page with no width class is sized by its content and
            collapses to a fraction of the row; min-w-0 lets wide children
            (tables, charts) scroll internally instead of stretching the flex item. */}
        <main className="min-w-0 flex-1">{children}</main>
        </div>
    );
}

export default layout;