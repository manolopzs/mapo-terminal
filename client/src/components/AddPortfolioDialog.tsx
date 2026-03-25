import { useState } from "react";
import { FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";

export function AddPortfolioDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("brokerage");

  const createPortfolio = useCreatePortfolio();
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    createPortfolio.mutate(
      { name, type },
      {
        onSuccess: () => {
          toast({ title: "Portfolio created", description: `${name} has been created` });
          setOpen(false);
          setName("");
          setType("brokerage");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create portfolio", variant: "destructive" });
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-border/50">
          <FolderPlus className="h-3.5 w-3.5" />
          New Portfolio
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
        <DialogHeader>
          <DialogTitle className="text-foreground uppercase tracking-wider text-sm">
            Create Portfolio
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Portfolio Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Portfolio"
              required
              className="mt-1 bg-accent border-border/50"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1 bg-accent border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brokerage">Brokerage</SelectItem>
                <SelectItem value="retirement">Retirement</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full"
            style={{ background: "hsl(var(--color-cyan))", color: "hsl(var(--background))" }}
            disabled={createPortfolio.isPending}
          >
            {createPortfolio.isPending ? "Creating..." : "Create Portfolio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
