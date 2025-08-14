import path from "path";
import { writeFile } from "fs/promises";

export const uploadFile = async (file: File, userId: string,filePath: string) => {
  try {

    if (file && file.name) {
      const arrayBuffer = await file.arrayBuffer();
      const extension = file.name.split(".").pop()?.toLowerCase();
      const newFileName = `${userId}.${extension}`;
      const filePathUrl = path.join(filePath, newFileName);

      await writeFile(filePathUrl, Buffer.from(arrayBuffer));

      // Return only the relative public path
      const fileUrl = `signatures/${newFileName}`;
      return fileUrl;
    }
    return null;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
};
