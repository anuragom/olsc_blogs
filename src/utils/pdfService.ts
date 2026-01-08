import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const execPromise = promisify(exec);

export const compressPDF = async (inputPath: string): Promise<string> => {
    const ext = path.extname(inputPath);
    const outputPath = inputPath.replace(ext, `-compressed${ext}`);

    try {
        const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
        
        await execPromise(command);

        // Delete the original heavy file
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(inputPath); 
            return outputPath;
        }
        return inputPath;
    } catch (error) {
        console.error("Compression Error:", error);
        return inputPath; // Fallback to original if compression fails
    }
};