import { useState } from "react";
import type { DriverEntry } from "../../types";
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";
import { X } from "lucide-react";
import { useData } from "../../hooks/useData";

interface DriverFormProps {
  initialData?: DriverEntry;
  onClose: () => void;
  onSave: (entry: DriverEntry) => void;
}

// Helper function to check for non-empty or non-zero value
const isValueValid = (value: any): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    // Check if it's a number and non-zero, or any other truthy value
    return !!value; 
};

// Utility function to generate the prop used to hide the required marker
const getValidationProp = (value: any) => ({
    // This prop tells the Input component to hide the visual marker
    hideRequiredIndicator: isValueValid(value)
});

export const DriverForm = ({
  initialData,
  onClose,
  onSave,
}: DriverFormProps) => {
  const { driverEntries } = useData();

  const [entry, setEntry] = useState({
    id: initialData?.id || "",
    driverName: initialData?.driverName || "",
    dlNo: initialData?.dlNo || "",
    mobile: initialData?.mobile || "",
  });

  const [errors, setErrors] = useState({
    driverName: "",
    dlNo: "",
    mobile: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setEntry((prev) => ({ ...prev, [name]: value }));

    // ---------------- IMMEDIATE VALIDATION -----------------

    if (name === "driverName") {
      const trimmed = value.trim();
      if (!trimmed) {
        setErrors((prev) => ({ ...prev, driverName: "Driver name is required" }));
      } else {
        
      }
    }

    if (name === "dlNo") {
      const trimmed = value.trim();
      if (!trimmed) {
        setErrors((prev) => ({ ...prev, dlNo: "DL number is required" }));
      } else {
        const exists = driverEntries.some(
          (d) =>
            d.dlNo.toLowerCase() === trimmed.toLowerCase() &&
            d.id !== initialData?.id
        );
        setErrors((prev) => ({
          ...prev,
          dlNo: exists ? "DL number already exists" : "",
        }));
      }
    }

    if (name === "mobile") {
      const trimmed = value.trim();

      if (!trimmed) {
        setErrors((prev) => ({ ...prev, mobile: "Mobile number is required" }));
      } else if (!/^\d{10}$/.test(trimmed)) {
        setErrors((prev) => ({
          ...prev,
          mobile: "Mobile number must be 10 digits",
        }));
      } else {
        const exists = driverEntries.some(
          (d) => d.mobile === trimmed && d.id !== initialData?.id
        );
        setErrors((prev) => ({
          ...prev,
          mobile: exists ? "Mobile number already exists" : "",
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    const newErrors = { driverName: "", dlNo: "", mobile: "" };

    const name = entry.driverName.trim();
    const dl = entry.dlNo.trim();
    const mobile = entry.mobile.trim();

    // Final validations
    if (!name) {
      newErrors.driverName = "Driver name is required";
      hasError = true;
    } else {
      const exists = driverEntries.some(
        (d) =>
          d.driverName.toLowerCase() === name.toLowerCase() &&
          d.id !== initialData?.id
      );
      if (exists) {
        newErrors.driverName = "Driver name already exists";
        hasError = true;
      }
    }

    if (!dl) {
      newErrors.dlNo = "DL number is required";
      hasError = true;
    } else {
      const exists = driverEntries.some(
        (d) => d.dlNo.toLowerCase() === dl.toLowerCase() && d.id !== initialData?.id
      );
      if (exists) {
        newErrors.dlNo = "DL number already exists";
        hasError = true;
      }
    }

    if (!mobile) {
      newErrors.mobile = "Mobile number is required";
      hasError = true;
    } else if (!/^\d{10}$/.test(mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits";
      hasError = true;
    } else {
      const exists = driverEntries.some(
        (d) => d.mobile === mobile && d.id !== initialData?.id
      );
      if (exists) {
        newErrors.mobile = "Mobile number already exists";
        hasError = true;
      }
    }

    setErrors(newErrors);

    if (hasError) return;

    const savedEntry: DriverEntry = {
      ...entry,
      id: initialData?.id || `DRV-${Date.now()}`,
      driverName: name,
      dlNo: dl,
      mobile,
    };

    onSave(savedEntry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-96 max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {initialData ? "Edit Driver" : "Add Driver"}
          </h2>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

            {/* Driver Name */}
            <div>
              <Input
                label="Driver Name"
                id="driverName"
                name="driverName"
                value={entry.driverName}
                onChange={handleChange}
                className={errors.driverName ? "border-red-500" : ""}
                required { ...getValidationProp(entry.driverName)}
              />
              {errors.driverName && (
                <p className="text-sm text-red-600 mt-1">{errors.driverName}</p>
              )}
            </div>

            {/* DL No */}
            <div>
              <Input
                label="DL Number"
                id="dlNo"
                name="dlNo"
                value={entry.dlNo}
                onChange={handleChange}
                className={errors.dlNo ? "border-red-500" : ""}
                required { ...getValidationProp(entry.dlNo)}
              />
              {errors.dlNo && (
                <p className="text-sm text-red-600 mt-1">{errors.dlNo}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <Input
                label="Mobile Number"
                id="mobile"
                name="mobile"
                value={entry.mobile}
                onChange={handleChange}
                className={errors.mobile ? "border-red-500" : ""}
                required { ...getValidationProp(entry.mobile)}
              />
              {errors.mobile && (
                <p className="text-sm text-red-600 mt-1">{errors.mobile}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={!!errors.driverName || !!errors.dlNo || !!errors.mobile}
            >
              Save Driver
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

