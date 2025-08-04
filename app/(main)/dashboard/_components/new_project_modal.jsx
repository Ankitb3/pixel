import { useConvexMutation, useConvexQuery } from '@/components/hooks/use-convex-query'
import { usePlanAccess } from '@/components/hooks/use-plan-access'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import UpgradeModal from '@/components/UpgradeModal'
import { api } from '@/convex/_generated/api'
import { Crown, ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

const NewProjectModal = ({ isOpen, onClosed }) => {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [projectTitle, setProjectTitle] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const onDrop = (accetedFiles) => {
    const file = accetedFiles[0]
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file))


      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      setProjectTitle(nameWithoutExt || "Untitled Project")
    }
  }
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1023
  })
  const { isFree, canCreateProject } = usePlanAccess()
  const { data: projects } = useConvexQuery(
    api.projects.getUserProjects
  );
  const { mutate: createProject } = useConvexMutation(
    api.projects.create
  );
  const currentProjectCount = projects?.length || 0
  const cancreate = canCreateProject(currentProjectCount)
  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProjectTitle("")
    setIsUploading(false)
    onClosed()
  }


  const handleCreateProject = async () => {
    if (!cancreate) {
      setShowUpgradeModal(true);
      return;
    }
    if (!selectedFile || !projectTitle.trim()) {
      toast.error("Please select an image and enter a project title");
      return
    }
    setIsUploading(true)
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("fileName", selectedFile.name);
      const uploadResponse = await fetch("/api/imagekit/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadResponse.json();



      if (!uploadData.success) {
        throw new Error(uploadData.error || "Failed to upload image");
      }

      // Create project in Convex
      const projectId = await createProject({
        title: projectTitle.trim(),
        originalImageUrl: uploadData.url,
        currentImageUrl: uploadData.url,
        thumbnailUrl: uploadData.thumbnailUrl,
        width: uploadData.width || 800,
        height: uploadData.height || 600,
        canvasState: null,
      });

      toast.success("Project created successfully!");
      // Navigate to editor
      router.push(`/editor/${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(
        error.message || "Failed to create project. Please try again."
      );
    } finally {
      setIsUploading(false);
    }

  }
  return (
    <>
      <Dialog open={isOpen} onOpenChanged={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            {
              isFree && (
                <Badge variant={'secondary'} className="bg-slate-700 text-white/70">{currentProjectCount}/3 Projects</Badge>
              )
            }
          </DialogHeader>
          <div className='space-y-6'>
            {
              isFree && currentProjectCount >= 2 &&

              <Alert className="bg-amber-500/10 border-amber-500/20">
                <Crown className="h-5 w-5 text-amber-400" />
                <AlertDescription className="text-amber-300/80">
                  <div className="font-semibold text-amber-400 mb-1">
                    {currentProjectCount === 2
                      ? "Last Free Project"
                      : "Project Limit Reached"}
                  </div>
                  {currentProjectCount === 2
                    ? "This will be your last free project. Upgrade to Pixxel Pro for unlimited projects."
                    : "Free plan is limited to 3 projects. Upgrade to Pixxel Pro to create more projects."}
                </AlertDescription>
              </Alert>
            }
          </div>

          {!selectedFile ? <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive ? "border-cyan-400 bg-cyan-400/5" : "border-white/20 hover:border-white/40"
            } ${!cancreate ? "opacity-50 pointer-events-none" : ""}`}>
            <input {...getInputProps()} />
            <Upload className='h-12 w-12 text-white/50 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-white mb-2'>
              {
                isDragActive ?
                  <p>Drop the Your image here ...</p> :
                  <p>Upload an Image</p>
              }
            </h3>
            <div>
              {
                cancreate ? "Drag and drop image, or click to browse" : "Upgrade to pro to create more projects"
              }
            </div>
            <p className='text-sm text-white/50'>Supports PNG,JPEG,WEBP UPTO 20MB</p>

          </div> : <div className='space-y-6'>
            <div className='relative'>
              <img src={previewUrl} alt="preview" className='w-full h-64 object-cover rounded-xl border border-white/10' />
              <Button variant={"ghost"}
                size={"icon"}
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setProjectTitle("")
                }


                }
                className={"absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-title" className="text-white">
                Project Title
              </Label>
              <Input
                id="project-title"
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter project name..."
                className="bg-slate-700 border-white/20 text-white placeholder-white/50 focus:border-cyan-400 focus:ring-cyan-400"
              />
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-white font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-white/70 text-sm">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

          </div>}
          <DialogFooter className={'gap-3'}>
            <Button variant="ghost"
              onClick={handleClose}
              className={"text-white/70 hover:text-white"}
            >
              Cancel
            </Button>
            <Button variant="primary"
              onClick={handleCreateProject}
              disable={!selectedFile || !projectTitle.trim() || isUploading}
              className={"text-white/70 hover:text-white"}
            >
              {
                isUploading ? <> <Loader2 className='h-4 w-4 animate-spin' /> Creating...</> : "Create Project"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)}
        restrictedTool="project"
        reason="Free plan is limited to 3 projects. Upgrade to Pro for unlimited projects and access to all AI editing tools"
      />
    </>
  )
}

export default NewProjectModal 