import { useState } from "react";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Alert, AlertDescription } from "./alert";
import { CheckCircle, XCircle } from "lucide-react";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function JsonEditor({ value, onChange, placeholder = '{}', rows = 8, className }: JsonEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string>("");

  const validateJson = (jsonString: string) => {
    try {
      if (jsonString.trim() === "") {
        setIsValid(true);
        setError("");
        return;
      }
      JSON.parse(jsonString);
      setIsValid(true);
      setError("");
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    validateJson(newValue);
  };

  const formatJson = () => {
    try {
      if (value.trim() === "") return;
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      setIsValid(true);
      setError("");
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`font-mono text-sm ${className} ${
            !isValid ? "border-red-500 focus:ring-red-500" : ""
          }`}
          data-testid="json-editor-textarea"
        />
        <div className="absolute top-2 right-2 flex items-center space-x-2">
          {isValid ? (
            <CheckCircle className="h-4 w-4 text-green-500" data-testid="json-valid-icon" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" data-testid="json-invalid-icon" />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={formatJson}
            disabled={!isValid || value.trim() === ""}
            data-testid="format-json-button"
          >
            Format
          </Button>
        </div>
      </div>
      {!isValid && error && (
        <Alert variant="destructive" data-testid="json-error-alert">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
