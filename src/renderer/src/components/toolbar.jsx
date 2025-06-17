import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Toolbar = ({ title, onSearch, children, afterSearch }) => {
    return (
        <Card className="border-none">
            <CardHeader className="flex flex-row justify-between items-center space-y-0 py-4">
                <div className="flex items-center space-x-4 mr-4">
                    <CardTitle className="font-bold text-nowrap">{typeof title == "function" ? title() : title}</CardTitle>
                </div>

                <div className="flex flex-grow items-center justify-end space-x-4">
                    {children}

                    {
                        onSearch &&
                        <div className="relative w-1/3">
                            <Search className="absolute top-2 left-2 text-gray-400" onChange={e => onSearch(e.target.value)} />
                            <Input
                                type="search"
                                placeholder="Faire une recherche rapide..."
                                onChange={(e) => onSearch(e.target.value)}
                                className="pl-10 text-lg"
                            />
                        </div>
                    }

                    {afterSearch}
                </div>
            </CardHeader>
        </Card>
    )
}

export default Toolbar;