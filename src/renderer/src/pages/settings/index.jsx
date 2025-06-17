import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, Info, ShieldPlus, Stethoscope, User, Wallet2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Toolbar from "@/components/toolbar";
import { Separator } from "@/components/ui/separator";
import Permission from "@/components/permission";
import TabInfos from "./tab-infos";
import TabPrices from "./tab-prices";
import TabDoctors from "./tab-doctors";
import TabServices from "./tab-services";
import TabMutuals from "./tab-mutuals";
import TabUsers from "./tab-users";

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState("infos");

    return (
        <div className="max-w-7xl mx-auto w-full pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 mt-0">
                <Toolbar title="Paramètres" />

                <div className="grid grid-cols-[auto_1fr] gap-5">
                    <Card className="mt-2">
                        <CardContent className="py-6">
                            <TabsList className="settings-sidebar flex flex-col space-y-2 h-auto p-0 items-start bg-white">
                                <TabsTrigger value="infos" className="justify-start h-8 ml-0 w-full">
                                    <Info size={17} className="mr-2" />
                                    Informations générales
                                </TabsTrigger>
                                <Permission name="prices_list">
                                    <Separator />
                                    <TabsTrigger value="prices" className="justify-start h-8 ml-0 w-full">
                                        <Wallet2 size={17} className="mr-2" />
                                        Liste des prix
                                    </TabsTrigger>
                                </Permission>
                                <Permission name="doctors_list">
                                    <Separator />
                                    <TabsTrigger value="doctors" className="justify-start h-8 ml-0 w-full">
                                        <Stethoscope size={17} className="mr-2" />
                                        Liste des docteurs
                                    </TabsTrigger>
                                </Permission>
                                <Permission name="services_list">
                                    <Separator />
                                    <TabsTrigger value="services" className="justify-start h-8 ml-0 w-full">
                                        <FileSpreadsheet size={17} className="mr-2" />
                                        Liste des types de prestations
                                    </TabsTrigger>
                                </Permission>
                                <Permission name="mutuals_list">
                                    <Separator />
                                    <TabsTrigger value="mutuals" className="justify-start h-8 ml-0 w-full">
                                        <ShieldPlus size={17} className="mr-2" />
                                        Liste des mutuelles
                                    </TabsTrigger>
                                </Permission>
                                <Permission name="users_list">
                                    <Separator />
                                    <TabsTrigger value="users" className="justify-start h-8 ml-0 w-full">
                                        <User size={17} className="mr-2" />
                                        Liste des utilisateurs
                                    </TabsTrigger>
                                </Permission>
                            </TabsList>
                        </CardContent>
                    </Card>
                    <div>
                        <TabInfos/>
                        <TabPrices/>
                        <TabDoctors/>
                        <TabServices/>
                        <TabMutuals/>
                        <TabUsers/>
                    </div>
                </div>
            </Tabs>
        </div>
    );
};

export default SettingsPage;
