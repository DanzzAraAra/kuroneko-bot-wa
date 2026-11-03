/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import axios from "axios";
import FormData from "form-data";

export async function uploader(buffer) {
  const { fileTypeFromBuffer } = await import("file-type");
  const type = await fileTypeFromBuffer(buffer);
  const ext = type?.ext || "bin";

  const formData = new FormData();

  formData.append("file", buffer, {
    filename: `file.${ext}`,
    contentType: type?.mime || "application/octet-stream"
  });

  try {
    const { data } = await axios.post(
      "https://danzy.web.id/api/upload",
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    if (!data?.url) {
      throw new Error("API tidak mengembalikan URL");
    }

    return data.url;
  } catch (err) {
    if (err.response?.status === 429) {
      throw new Error(
        "Terlalu banyak upload, tunggu 1 menit sebelum upload lagi"
      );
    }

    throw new Error("Upload gagal");
  }
}