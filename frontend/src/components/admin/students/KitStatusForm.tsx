import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Kit, KitUpdateData } from "@/types";
import { formatDate } from "@/utils/helpers";
import { Package } from "lucide-react";

// Define form validation schema
const kitStatusFormSchema = z
  .object({
    status: z.enum(["requested", "processing", "delivered"]),
    deliveredDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "delivered" && !data.deliveredDate) {
        return false;
      }
      return true;
    },
    {
      message: "Delivered date is required when status is 'delivered'",
      path: ["deliveredDate"],
    },
  );

interface KitStatusFormProps {
  kit: Kit;
  onSubmit: (data: KitUpdateData) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export const KitStatusForm: React.FC<KitStatusFormProps> = ({
  kit,
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const form = useForm<KitUpdateData>({
    resolver: zodResolver(kitStatusFormSchema),
    defaultValues: {
      status: kit.status,
      deliveredDate: kit.deliveredDate
        ? new Date(kit.deliveredDate).toISOString().split("T")[0]
        : "",
      notes: kit.notes || "",
    },
  });

  const selectedStatus = form.watch("status");

  const handleSubmit = (data: KitUpdateData) => {
    // Convert date string to ISO string for API if provided
    if (data.deliveredDate) {
      data.deliveredDate = new Date(data.deliveredDate).toISOString();
    } else if (data.status !== "delivered") {
      // Remove deliveredDate if status is not delivered
      delete data.deliveredDate;
    }

    onSubmit(data);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500 hover:bg-green-600";
      case "processing":
        return "bg-blue-500 hover:bg-blue-600";
      case "requested":
        return "bg-yellow-500 hover:bg-yellow-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Update Kit Status
        </CardTitle>
        <CardDescription>
          Update the status and details for this kit request.
        </CardDescription>
      </CardHeader>

      {/* Kit Information Display */}
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{kit.itemName}</h3>
            <Badge className={getStatusBadgeColor(kit.status)}>
              {kit.status}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Size:</span> {kit.size}
            </div>
            <div>
              <span className="font-medium">Requested:</span>{" "}
              {formatDate(kit.requestedDate)}
            </div>
            {kit.deliveredDate && (
              <div>
                <span className="font-medium">Delivered:</span>{" "}
                {formatDate(kit.deliveredDate)}
              </div>
            )}
          </div>
          {kit.notes && (
            <div className="text-sm">
              <span className="font-medium text-gray-600">Current Notes:</span>{" "}
              {kit.notes}
            </div>
          )}
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Status Field */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="requested">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            Requested
                          </div>
                        </SelectItem>
                        <SelectItem value="processing">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            Processing
                          </div>
                        </SelectItem>
                        <SelectItem value="delivered">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Delivered
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Delivered Date Field - Only show when status is delivered */}
            {selectedStatus === "delivered" && (
              <FormField
                control={form.control}
                name="deliveredDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivered Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={isLoading}
                        max={new Date().toISOString().split("T")[0]} // Can't be future date
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this kit status update..."
                      {...field}
                      disabled={isLoading}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="flex justify-between px-0">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Kit Status"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
