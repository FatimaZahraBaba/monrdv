import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Palette, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import RequiredStar from "@/components/required";
import Datepicker from "./datepicker";
import { format } from "date-fns";
import axios from "axios";

const initialFormData = {
  title: "",
  description: "",
  color: "#ea580b",
  date: "",
  done: false,
};

const NotesModal = ({ data, isDialogOpen, setIsDialogOpen, validationCallback }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    setFormData({
      ...initialFormData,
      ...data,
      description: data?.description || ""
    });
  }, [data])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (formData.id) {
        await axios.put(`/notes/${formData.id}`, {
          ...formData,
          date: format(formData.date, "yyyy-MM-dd"),
        });
      } else {
        await axios.post("/notes", {
          ...formData,
          date: format(formData.date, "yyyy-MM-dd"),
        });
      }

      setIsDialogOpen(false);
      validationCallback();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-md">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
            <Loader2 className="h-10 w-10 animate-spin text-black" />
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{formData.id ? "Modifier la note" : "Ajouter une note"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-6 mt-4">
          <div className="grid grid-cols-[2fr_1fr] gap-6">
            <div>
              <Label>Date <RequiredStar /></Label>
              <Datepicker value={formData.date} onChange={({ date }) => setFormData({ ...formData, date })} />
            </div>
            <div>
              <Label>Couleur</Label>
              <div className="flex items-center space-x-2">
                <div className="flex-grow">
                  <Input
                    className="w-full"
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange} />
                </div>
                <Button size="icon" variant="outline" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFormData({ ...formData, color: initialFormData.color });
                }}>
                  <X />
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Label>Titre <RequiredStar /></Label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              onBlur={(e) => setFormData({ ...formData, title: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) })}
              placeholder="Entrez le titre de la note" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="description" value={formData.description} onChange={handleInputChange} />
          </div>
        </form>

        <Separator className="my-6" />
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={loading} variant="outline">Annuler</Button>
          </DialogClose>
          <Button className="w-32" disabled={loading} onClick={() => handleSubmit()}>
            {formData.id ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotesModal;
