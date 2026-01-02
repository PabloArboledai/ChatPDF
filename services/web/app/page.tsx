import UploadForm from "@/components/UploadForm";

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Crear un job</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Sube un PDF y elige el tipo de procesamiento. El worker ejecutará el job en background.
      </p>
      <UploadForm />
    </div>
  );
}
