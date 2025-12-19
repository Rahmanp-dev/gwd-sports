import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentPublicService } from "@/services/studentService";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";

export default function KitManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [kitName, setKitName] = useState("");
  const [kits, setKits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch kits function
  const fetchKits = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await studentPublicService.getKits();
      setKits(response.data?.kits || []);
    } catch (error) {
      console.error("Error fetching kits:", error);
      toast.error("Failed to load kits");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch kits on mount
  useEffect(() => {
    fetchKits();
  }, [fetchKits]);

  // Request kit mutation
  const requestKitMutation = useMutation({
    mutationFn: (kitName: string) => studentPublicService.requestKit(kitName),
    onSuccess: async () => {
      toast.success("Kit requested successfully!");
      setIsDialogOpen(false);
      setKitName("");
      // Refetch kits after successful request
      await fetchKits();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to request kit");
    },
  });

  const handleRequestKit = () => {
    if (!kitName.trim()) {
      toast.error("Please enter a kit name");
      return;
    }
    if (kitName.trim().length < 3) {
      toast.error("Kit name must be at least 3 characters long");
      return;
    }
    if (kitName.trim().length > 50) {
      toast.error("Kit name must be at most 50 characters long");
      return;
    }
    requestKitMutation.mutate(kitName.trim());
  };

  const getStatusBadge = (
    status: "delivered" | "requested" | "processing" | "rejected",
  ) => {
    const statusConfig = {
      delivered: {
        label: "Delivered",
        className: "bg-green-500/20 text-green-400 border-green-500/50",
        icon: CheckCircle,
      },
      requested: {
        label: "Requested",
        className: "bg-blue-500/20 text-blue-400 border-blue-500/50",
        icon: Clock,
      },
      processing: {
        label: "Processing",
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
        icon: Loader,
      },
      rejected: {
        label: "Rejected",
        className: "bg-red-500/20 text-red-400 border-red-500/50",
        icon: XCircle,
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Kit Management</h2>
            <p className="text-gray-400 mt-1">
              Request and track your sports kits
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Kit
          </Button>
        </div>

        {kits.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No Kits Requested
              </h3>
              <p className="text-gray-500 text-center mb-4">
                You haven't requested any kits yet. Click the button above to
                request your first kit.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kits.map((kit, index) => (
              <motion.div key={kit._id} variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-green-500/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">
                            {kit.kitName}
                          </CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Status:</span>
                      {getStatusBadge(kit.status)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Requested:</span>
                      <span className="text-sm text-white">
                        {new Date(kit.requestedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {kit.deliveredAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          Delivered:
                        </span>
                        <span className="text-sm text-white">
                          {new Date(kit.deliveredAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {kit.cost !== undefined && kit.cost > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                        <span className="text-sm text-gray-400">Cost:</span>
                        <span className="text-lg font-bold text-green-400">
                          ₹{kit.cost}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Request Kit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Request New Kit</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the name of the kit you want to request. The admin will
              review and process your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kitName" className="text-white">
                Kit Name
              </Label>
              <Input
                id="kitName"
                placeholder="e.g., Football Training Kit"
                value={kitName}
                onChange={(e) => setKitName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRequestKit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setKitName("");
              }}
              className="border-gray-700 text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestKit}
              disabled={requestKitMutation.isPending || !kitName.trim()}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {requestKitMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                "Request Kit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
