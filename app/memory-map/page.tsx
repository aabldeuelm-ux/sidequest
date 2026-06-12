"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Image as ImageIcon, Trash2, Calendar, Camera, X, RefreshCw, Check, Search, Video as VideoIcon } from "lucide-react";
import { useIndexedDB } from "@/hooks/useIndexedDB";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { PrimaryButton } from "@/components/PrimaryButton";
import { formatDate, compressImage } from "@/lib/utils";
import { Memory } from "@/types";

const FILTERS = [
  { id: "none", name: "Original", style: "none" },
  { id: "grayscale", name: "B&W", style: "grayscale(100%)" },
  { id: "sepia", name: "Sepia", style: "sepia(100%)" },
  { id: "vintage", name: "Vintage", style: "sepia(50%) hue-rotate(-30deg) saturate(140%) contrast(1.1)" },
  { id: "contrast", name: "Contrast", style: "contrast(150%)" },
];

export default function MemoryMap() {
  const [memories, setMemories, isMemoriesLoaded] = useIndexedDB<Memory[]>("memories-idb", []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Camera states and refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  
  // Capture states
  const [captureMode, setCaptureMode] = useState<"photo" | "video">("photo");
  const [tempCapturedImage, setTempCapturedImage] = useState(""); 
  const [tempCaptureType, setTempCaptureType] = useState<"photo" | "video">("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeFilter, setActiveFilter] = useState("none");

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunks = useRef<Blob[]>([]);

  // Local Storage Migration
  useEffect(() => {
    if (isMemoriesLoaded && typeof window !== "undefined") {
      const localMemories = window.localStorage.getItem("memories");
      if (localMemories) {
        try {
          const parsed = JSON.parse(localMemories);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMemories((prev) => {
              const existingIds = new Set(prev.map(p => p.id));
              const newMemories = parsed.filter(m => !existingIds.has(m.id));
              return [...newMemories, ...prev];
            });
          }
          window.localStorage.removeItem("memories");
        } catch (e) {
          console.error("Migration error:", e);
        }
      }
    }
  }, [isMemoriesLoaded, setMemories]);

  // Recording Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 9) { // 10 seconds limit
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const startCamera = async (mode: "environment" | "user" = facingMode) => {
    setIsCameraActive(true);
    setError("");
    setTempCapturedImage("");
    setIsRecording(false);
    setActiveFilter("none");
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: captureMode === "video"
      });
      setStream(mediaStream);
      setFacingMode(mode);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      setError("Failed to access camera/microphone. Please check permissions.");
      setIsCameraActive(false);
      console.error("Camera start error:", err);
    }
  };

  const stopCamera = () => {
    if (isRecording) {
      stopRecording();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setTempCapturedImage("");
  };

  const toggleCameraFacingMode = () => {
    startCamera(facingMode === "environment" ? "user" : "environment");
  };

  const toggleCaptureMode = (mode: "photo" | "video") => {
    if (captureMode === mode) return;
    setCaptureMode(mode);
    if (isCameraActive && !tempCapturedImage) {
      startCamera(facingMode);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (facingMode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        const filterStyle = FILTERS.find(f => f.id === activeFilter)?.style || "none";
        if (filterStyle !== "none") {
          ctx.filter = filterStyle;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const capturedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setTempCapturedImage(capturedDataUrl);
        setTempCaptureType("photo");
        
        ctx.filter = "none";
      }
    }
  };

  const handleStartRecording = () => {
    if (!stream) return;
    videoChunks.current = [];
    
    let mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4'; 
    }
    
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunks.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setTempCapturedImage(reader.result as string);
          setTempCaptureType("video");
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (e) {
      console.error("MediaRecorder start failed:", e);
      setError("Video recording is not supported on this browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleConfirmMedia = () => {
    setPhotoBase64(tempCapturedImage);
    stopCamera();
    if (!isModalOpen) {
      setIsModalOpen(true);
    }
  };

  const handleRetakeMedia = () => {
    setTempCapturedImage("");
    setRecordingTime(0);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError("");
      try {
        if (file.type.startsWith("video/")) {
           if (file.size > 50 * 1024 * 1024) {
             throw new Error("Video file is too large. Please select a video under 50MB.");
           }
           const reader = new FileReader();
           reader.readAsDataURL(file);
           reader.onload = () => {
             setPhotoBase64(reader.result as string);
             setTempCaptureType("video");
             setIsLoading(false);
           };
           reader.onerror = () => {
             throw new Error("Failed to read video file");
           }
        } else {
          const compressedBase64 = await compressImage(file, 1000, 1000, 0.7);
          setPhotoBase64(compressedBase64);
          setTempCaptureType("photo");
          setIsLoading(false);
        }
      } catch (err: any) {
        setError(err.message || "Could not process the selected file.");
        console.error("File processing error:", err);
        setIsLoading(false);
      }
    }
  };

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoBase64) {
      setError("Please select or capture a memory.");
      return;
    }
    if (!caption.trim()) {
      setError("Please write a short caption.");
      return;
    }

    const newMemory: Memory = {
      id: crypto.randomUUID(),
      photoUrl: photoBase64,
      caption: caption.trim(),
      date,
      type: tempCaptureType,
      createdAt: new Date().toISOString(),
    };

    setMemories((prev) => [newMemory, ...prev]);
    setIsModalOpen(false);
    setCaption("");
    setPhotoBase64("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleDeleteMemory = (id: string) => {
    if (window.confirm("Are you sure you want to delete this memory?")) {
      setMemories((prev) => prev.filter((m) => m.id !== id));
      if (selectedMemory?.id === id) {
        setSelectedMemory(null);
      }
    }
  };

  const filteredMemories = memories.filter(m => 
    m.caption.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <SectionHeader
        title="Memory Map"
        description="Capture fragments of time. Build a mosaic of moments that matter."
        action={
          <PrimaryButton onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-1.5" />
            Capture Moment
          </PrimaryButton>
        }
      />

      {memories.length > 0 && (
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search memories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
        </div>
      )}

      {memories.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-8 h-8 text-indigo-500" />}
          title="No memories recorded yet"
          description="Every great quest has moments worth remembering. Click below to add your first visual memory."
          action={
            <PrimaryButton onClick={() => setIsModalOpen(true)}>
              Add First Memory
            </PrimaryButton>
          }
        />
      ) : filteredMemories.length === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8 text-neutral-500" />}
          title="No memories found"
          description={`We couldn't find any memories matching "${searchQuery}".`}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              onClick={() => setSelectedMemory(memory)}
              className="group bg-card border border-border rounded-xl shadow-sm hover:border-neutral-500 transition-all duration-300 flex flex-col cursor-pointer overflow-hidden"
            >
              <div className="relative w-full flex items-center justify-center p-3">
                {memory.type === "video" ? (
                  <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden border border-border/50">
                    <video
                      src={memory.photoUrl}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                    <div className="absolute top-2 left-2 bg-black/60 p-1.5 rounded-lg text-white z-10">
                      <VideoIcon className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full aspect-square rotate-1 group-hover:rotate-0 transition-all duration-500 drop-shadow-md">
                    <div className="absolute inset-0 stamp-edge bg-[#f4f4f5]"></div>
                    <div className="absolute inset-0 p-2 pb-6 z-10 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={memory.photoUrl}
                        alt={memory.caption}
                        className="w-full h-full object-cover shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"
                      />
                    </div>
                  </div>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMemory(memory.id);
                  }}
                  className="absolute top-5 right-5 p-1.5 rounded-lg bg-black/60 text-red-400 hover:text-red-500 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed">
                  {memory.caption}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(memory.date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError("");
          setCaption("");
          setPhotoBase64("");
          setDate(new Date().toISOString().split("T")[0]);
        }}
        title="Capture Moment"
      >
        <form onSubmit={handleSaveMemory} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Media
            </label>
            <div className="relative flex flex-col border border-dashed border-border rounded-xl p-4 bg-muted/30">
              {photoBase64 ? (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-black flex items-center justify-center">
                  {tempCaptureType === "video" ? (
                    <video
                      src={photoBase64}
                      className="max-h-full max-w-full object-contain"
                      controls
                      autoPlay
                      playsInline
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={photoBase64}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoBase64("");
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/90 transition-all text-xs font-medium cursor-pointer z-10"
                  >
                    Change Media
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 w-full">
                  <label className="flex flex-col items-center justify-center cursor-pointer py-6 px-4 bg-card border border-border hover:border-primary/50 hover:bg-muted/50 rounded-lg transition-all shadow-sm group">
                    <ImageIcon className="w-6 h-6 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-foreground text-center">Upload Media</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setCaptureMode("photo");
                      startCamera("environment");
                    }}
                    className="flex flex-col items-center justify-center py-6 px-4 bg-card border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-lg transition-all shadow-sm group"
                  >
                    <Camera className="w-6 h-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-foreground text-center">Open Camera</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Caption
            </label>
            <input
              type="text"
              maxLength={80}
              placeholder="What was this moment?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date of Memory
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-border mt-6">
            <PrimaryButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setError("");
                setCaption("");
                setPhotoBase64("");
                setDate(new Date().toISOString().split("T")[0]);
              }}
            >
              Cancel
            </PrimaryButton>
            <PrimaryButton type="submit" isLoading={isLoading}>
              Save Memory
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* View Memory Detail Modal */}
      <Modal
        isOpen={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
        title="View Memory"
        className="max-w-2xl"
      >
        {selectedMemory && (
          <div className="space-y-4">
            <div className="relative w-full bg-black rounded-xl overflow-hidden flex items-center justify-center border border-border">
              {selectedMemory.type === "video" ? (
                <video
                  src={selectedMemory.photoUrl}
                  className="w-full h-auto max-h-[60vh] object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedMemory.photoUrl}
                  alt={selectedMemory.caption}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              )}
            </div>
            
            <div className="space-y-3 pt-2">
              <p className="text-base font-semibold text-foreground tracking-tight leading-relaxed">
                {selectedMemory.caption}
              </p>
              
              <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedMemory.date)}
                </span>
                
                <button
                  onClick={() => {
                    handleDeleteMemory(selectedMemory.id);
                  }}
                  className="text-red-400 hover:text-red-500 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Memory
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Full Screen Camera App UI */}
      {isCameraActive && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
          
          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 p-6 pt-10 md:pt-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={() => stopCamera()}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
            
            {!tempCapturedImage && !isRecording && (
              <div className="flex bg-black/40 rounded-full overflow-hidden backdrop-blur-md border border-white/10 p-1">
                <button 
                  onClick={() => toggleCaptureMode("photo")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${captureMode === 'photo' ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
                >
                  PHOTO
                </button>
                <button 
                  onClick={() => toggleCaptureMode("video")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${captureMode === 'video' ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
                >
                  VIDEO
                </button>
              </div>
            )}

            {!tempCapturedImage && !isRecording && (
              <button
                onClick={toggleCameraFacingMode}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all active:scale-95"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            )}
            
            {!tempCapturedImage && isRecording && <div className="w-12 h-12" />}
          </div>

          {/* Camera Viewfinder or Captured Media Preview */}
          <div className="w-full h-full relative flex items-center justify-center bg-neutral-900 overflow-hidden">
            {tempCapturedImage ? (
              tempCaptureType === "video" ? (
                <video
                  src={tempCapturedImage}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  playsInline
                  loop
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={tempCapturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-transform duration-300 ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                  style={{ filter: captureMode === "photo" ? FILTERS.find(f => f.id === activeFilter)?.style : "none" }}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-neutral-400 animate-pulse">
                  <Camera className="w-8 h-8 opacity-50" />
                  <span className="text-sm font-medium tracking-wide">Initializing camera...</span>
                </div>
              )
            )}

            {/* Recording Timer Overlay */}
            {isRecording && !tempCapturedImage && (
              <div className="absolute top-24 z-20 flex items-center gap-2 bg-red-500/20 px-4 py-1.5 rounded-full border border-red-500/50 backdrop-blur-md">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-50 font-medium text-sm tracking-widest">00:0{recordingTime} / 00:10</span>
              </div>
            )}

            {/* Viewfinder Frame Overlay */}
            {!tempCapturedImage && stream && (
               <div className={`absolute inset-0 pointer-events-none p-10 flex flex-col justify-between opacity-60 transition-all ${isRecording ? 'scale-105 opacity-0' : 'scale-100'}`}>
                 <div className="flex justify-between">
                   <div className="w-16 h-16 border-t-2 border-l-2 border-white rounded-tl-2xl" />
                   <div className="w-16 h-16 border-t-2 border-r-2 border-white rounded-tr-2xl" />
                 </div>
                 <div className="flex justify-between">
                   <div className="w-16 h-16 border-b-2 border-l-2 border-white rounded-bl-2xl" />
                   <div className="w-16 h-16 border-b-2 border-r-2 border-white rounded-br-2xl" />
                 </div>
               </div>
            )}
          </div>

          {/* Filter Selection Row */}
          {!tempCapturedImage && !isRecording && captureMode === "photo" && (
            <div className="absolute bottom-36 left-0 right-0 flex justify-center gap-3 overflow-x-auto px-6 py-2 no-scrollbar z-20">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all backdrop-blur-md border ${
                    activeFilter === f.id 
                      ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                      : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex justify-center items-center z-20 bg-gradient-to-t from-black/90 to-transparent">
            {tempCapturedImage ? (
              <div className="flex w-full max-w-sm justify-between items-center px-4">
                <button
                  onClick={handleRetakeMedia}
                  className="px-6 py-3.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-medium backdrop-blur-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Retake
                </button>
                <button
                  onClick={handleConfirmMedia}
                  className="px-6 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Use {tempCaptureType === "video" ? "Video" : "Photo"}
                </button>
              </div>
            ) : (
              captureMode === "photo" ? (
                <button
                  onClick={handleCapturePhoto}
                  disabled={!stream}
                  className="w-20 h-20 rounded-full border-[4px] border-white/80 p-1.5 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  <div className="w-full h-full rounded-full bg-white shadow-inner" />
                </button>
              ) : (
                <button
                  onClick={isRecording ? stopRecording : handleStartRecording}
                  disabled={!stream}
                  className="w-20 h-20 rounded-full border-[4px] border-white/80 p-1.5 flex items-center justify-center transition-all disabled:opacity-50"
                >
                  {isRecording ? (
                    <div className="w-8 h-8 rounded-sm bg-red-500 shadow-inner animate-pulse" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-red-500 shadow-inner" />
                  )}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
