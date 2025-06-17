import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  } from "@/components/ui/sidebar";
  
  import { Calendar, Home, Inbox, Search, Settings, User } from "lucide-react";
  
  // Menu items.
  const items = [
    {
      title: "Home",
      url: "#",
      icon: Home,
    },
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
    },
    {
      title: "Calendar",
      url: "#",
      icon: Calendar,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
  ];
  
  export default function AppSidebar() {
    return (
      <Sidebar className="h-screen w-64 bg-white flex flex-col">
        {/* Logo Section */}
        <div className="p-4 flex items-center space-x-2 border-b">
          <div className="bg-gray-100 h-10 w-10 flex items-center justify-center rounded-full">
            <User size={20} className="text-gray-600" />
          </div>
          <h1 className="text-lg font-bold">AppLogo</h1>
        </div>
  
        {/* Menu Section */}
        <SidebarContent className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a
                        href={item.url}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
                      >
                        <item.icon className="text-gray-600" />
                        <span className="text-gray-800">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
  
        {/* Connected User Section */}
        <div className="p-4 border-t flex items-center space-x-2">
          <div className="bg-gray-100 h-10 w-10 flex items-center justify-center rounded-full">
            <User size={20} className="text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">John Doe</p>
            <p className="text-xs text-gray-500">john.doe@example.com</p>
          </div>
        </div>
      </Sidebar>
    );
  }
  