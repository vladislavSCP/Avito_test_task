import axios from "axios";

export const http = axios.create({
  baseURL: "/api/v1",
  paramsSerializer: (params) => {
    const sp = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((v) => sp.append(key, String(v)));
      } else {
        sp.append(key, String(value));
      }
    });
    return sp.toString();
  },
});
