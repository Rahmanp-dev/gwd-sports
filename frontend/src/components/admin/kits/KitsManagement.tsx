import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studentAdminService } from "@/services/studentService";
import { toast } from "sonner";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Search,
  Filter,
  Edit,
} from "lucide-react";

type KitStatus = "delivered" | "requested" | "processing" | "rejected";

interface Kit {
  _id: string;
  studentProfileId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  kitId: string;
  kitName: string;
  kitStatus: KitStatus;
  kitCost?: number;
  requestedAt: string;
  deliveredAt?: string | null;
}

export const KitsManagement: React.FC = () => {
  const [kits, setKits] = useState<Kit[]>([]);
  const [filteredKits, setFilteredKits] = useState<Kit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [updateStatus, setUpdateStatus] = useState<KitStatus>("requested");
  const [updateCost, setUpdateCost] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchKits = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await studentAdminService.getAllKits();
      setKits(response.data.kits);
      setFilteredKits(response.data.kits);
    } catch (error) {
      console.error("Error fetching kits:", error);
      toast.error("Failed to load kits");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKits();
  }, [fetchKits]);

  useEffect(() => {
    let filtered = kits;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (kit) =>
          kit.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          kit.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          kit.kitName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((kit) => kit.kitStatus === statusFilter);
    }

    setFilteredKits(filtered);
  }, [searchTerm, statusFilter, kits]);

  const handleUpdateKit = (kit: Kit) => {
    setSelectedKit(kit);
    setUpdateStatus(kit.kitStatus);
    setUpdateCost(kit.kitCost?.toString() || "");
    setIsUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = async () => {
    if (!selectedKit) return;

    try {
      setIsUpdating(true);
      await studentAdminService.updateKitStatus(
        selectedKit.studentProfileId,
        selectedKit.kitId,
        {
          status: updateStatus,
          cost: updateCost ? parseFloat(updateCost) : 0,
        },
      );
      toast.success("Kit status updated successfully!");
      setIsUpdateDialogOpen(false);
      await fetchKits();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update kit");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: KitStatus) => {
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
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  const stats = {
    total: kits.length,
    requested: kits.filter((k) => k.kitStatus === "requested").length,
    processing: kits.filter((k) => k.kitStatus === "processing").length,
    delivered: kits.filter((k) => k.kitStatus === "delivered").length,
    rejected: kits.filter((k) => k.kitStatus === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Kits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Requested</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.requested}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Processing</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.processing}
                </p>
              </div>
              <Loader className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.delivered}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by student name, email, or kit name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kits List */}
      {filteredKits.length === 0 ? (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Kits Found
            </h3>
            <p className="text-gray-500 text-center">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "No kit requests yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 gap-4"
        >
          {filteredKits.map((kit) => (
            <motion.div
              key={`${kit.studentProfileId}-${kit.kitId}`}
              variants={itemVariants}
            >
              <Card className="bg-white border-gray-200 shadow-sm hover:border-green-500 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {kit.kitName}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Student:{" "}
                            <span className="text-gray-900 font-medium">
                              {kit.studentName}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Email:{" "}
                            <span className="text-gray-900">
                              {kit.studentEmail}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Requested:{" "}
                            <span className="text-gray-900">
                              {new Date(kit.requestedAt).toLocaleDateString()}
                            </span>
                          </p>
                          {kit.deliveredAt && (
                            <p className="text-sm text-gray-600">
                              Delivered:{" "}
                              <span className="text-gray-900">
                                {new Date(kit.deliveredAt).toLocaleDateString()}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-3">
                      {getStatusBadge(kit.kitStatus)}
                      {kit.kitCost !== undefined && kit.kitCost > 0 && (
                        <p className="text-lg font-bold text-green-400">
                          ₹{kit.kitCost}
                        </p>
                      )}
                      {kit.kitStatus !== "delivered" &&
                        kit.kitStatus !== "rejected" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateKit(kit)}
                            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Update
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Update Kit Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Update Kit Status
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Update the status and cost for {selectedKit?.kitName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-900">
                Status
              </Label>
              <Select
                value={updateStatus}
                onValueChange={(value: KitStatus) => setUpdateStatus(value)}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost" className="text-gray-900">
                Cost (₹){" "}
                <span className="text-gray-500 text-sm">(optional)</span>
              </Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 75.00"
                value={updateCost}
                onChange={(e) => setUpdateCost(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitUpdate}
              disabled={isUpdating}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isUpdating ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Kit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
