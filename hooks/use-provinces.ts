import { useState, useEffect } from "react";

export interface Ward {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  province_code: number;
}

export interface Province {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  phone_code: number;
}

export function useProvinces() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [wardsError, setWardsError] = useState<string | null>(null);
  const [wardsByProvince, setWardsByProvince] = useState<Record<number, Ward[]>>({});

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://provinces.open-api.vn/api/v2/p/");
        if (!response.ok) throw new Error("Failed to fetch provinces");
        const data: Province[] = await response.json();
        setProvinces(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setProvinces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  const fetchWardsByProvince = async (provinceCode: number): Promise<Ward[]> => {
    if (wardsByProvince[provinceCode]) {
      return wardsByProvince[provinceCode];
    }

    try {
      setWardsLoading(true);
      setWardsError(null);
      const response = await fetch(
        `https://provinces.open-api.vn/api/v2/w/?province=${provinceCode}`
      );
      if (!response.ok) throw new Error("Failed to fetch wards");
      const data: Ward[] = await response.json();

      setWardsByProvince((prev) => ({
        ...prev,
        [provinceCode]: data,
      }));

      return data;
    } catch (err) {
      setWardsError(err instanceof Error ? err.message : "Unknown error");
      return [];
    } finally {
      setWardsLoading(false);
    }
  };

  return {
    provinces,
    loading,
    error,
    wardsLoading,
    wardsError,
    fetchWardsByProvince,
  };
}
