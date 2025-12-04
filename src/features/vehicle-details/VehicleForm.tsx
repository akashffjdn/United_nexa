import { useState } from "react";
import type { VehicleEntry } from "../../types";
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";
import { X } from "lucide-react";
import { useData } from "../../hooks/useData";
// 🟢 NEW: Imports
import { vehicleSchema } from "../../schemas";
import { useToast } from "../../contexts/ToastContext";

interface VehicleFormProps {
  initialData?: VehicleEntry;
  onClose: () => void;
  onSave: (entry: VehicleEntry) => void;
}

const isValueValid = (value: any): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return !!value; 
};

const getValidationProp = (value: any) => ({
    hideRequiredIndicator: isValueValid(value)
});

export const VehicleForm = ({
  initialData,
  onClose,
  onSave,
}: VehicleFormProps) => {
  const { vehicleEntries } = useData();
  const toast = useToast();

  // 🟢 NEW: Validation State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [entry, setEntry] = useState({
    id: initialData?.id || "",
    vehicleNo: initialData?.vehicleNo || "",
    vehicleName: initialData?.vehicleName || "",
    ownerName: initialData?.ownerName || "",
    ownerMobile: initialData?.ownerMobile || "",
  });

  // Manual checks state (kept for immediate duplicate feedback)
  const [manualErrors, setManualErrors] = useState({
    vehicleNo: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEntry((prev) => ({ ...prev, [name]: value }));
    
    // Clear Zod error
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));

    // Immediate Duplicate Check for Vehicle No
    if (name === "vehicleNo") {
      const trimmed = value.trim();
      const exists = vehicleEntries.some(
        (v) =>
          v.vehicleNo.toLowerCase() === trimmed.toLowerCase() &&
          v.id !== initialData?.id
      );

      setManualErrors((prev) => ({
        ...prev,
        vehicleNo: exists ? "Vehicle number already exists" : "",
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // 🟢 1. Check duplicates first
    if (manualErrors.vehicleNo) {
        toast.error("Vehicle number already exists.");
        return;
    }

    // 🟢 2. Zod Validation
    const validationResult = vehicleSchema.safeParse(entry);

    if (!validationResult.success) {
        const newErrors: Record<string, string> = {};
        validationResult.error.issues.forEach((err: any) => {
            if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setFormErrors(newErrors);
        toast.error("Please correct the errors in the form.");
        return;
    }

    const savedEntry: VehicleEntry = {
      ...entry,
      id: initialData?.id || `VEH-${Date.now()}`,
      vehicleNo: entry.vehicleNo.trim(),
      vehicleName: entry.vehicleName.trim(),
      ownerName: entry.ownerName.trim(),
      ownerMobile: entry.ownerMobile.trim(),
    };

    onSave(savedEntry);
  };

  return (
    <div className="fixed -top-6 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-96 max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {initialData ? "Edit Vehicle" : "Add Vehicle"}
          </h2>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

            <div>
              <Input
                label="Vehicle Number"
                id="vehicleNo"
                name="vehicleNo"
                value={entry.vehicleNo}
                onChange={handleChange}
                className={manualErrors.vehicleNo ? "border-red-500" : ""}
                required { ...getValidationProp(entry.vehicleNo)}
              />
              {/* Show either manual dup error or zod error */}
              {manualErrors.vehicleNo && (
                <p className="text-sm text-red-600 mt-1">{manualErrors.vehicleNo}</p>
              )}
              {formErrors.vehicleNo && !manualErrors.vehicleNo && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.vehicleNo}</p>
              )}
            </div>

            <div>
              <Input
                label="Vehicle Name"
                id="vehicleName"
                name="vehicleName"
                value={entry.vehicleName}
                onChange={handleChange}
                required { ...getValidationProp(entry.vehicleName)}
              />
              {formErrors.vehicleName && <p className="text-sm text-red-600 mt-1">{formErrors.vehicleName}</p>}
            </div>

            <div>
              <Input
                label="Owner Name"
                id="ownerName"
                name="ownerName"
                value={entry.ownerName}
                onChange={handleChange}
                { ...getValidationProp(entry.ownerName)}
              />
              {formErrors.ownerName && <p className="text-sm text-red-600 mt-1">{formErrors.ownerName}</p>}
            </div>

            <div>
              <Input
                label="Owner Mobile"
                id="ownerMobile"
                name="ownerMobile"
                value={entry.ownerMobile}
                onChange={handleChange}
                { ...getValidationProp(entry.ownerMobile)}
              />
              {formErrors.ownerMobile && <p className="text-sm text-red-600 mt-1">{formErrors.ownerMobile}</p>}
            </div>

          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
            >
              Save Vehicle
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};