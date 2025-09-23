

"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, FileUp, CheckCircle, Loader2, MapPin, Mic, Sparkles, X, Edit } from 'lucide-react';
import { getLocationSuggestion, getDepartmentSuggestion, getAddressCompletions } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { departments, indianStates } from '@/lib/data';
import { Combobox } from '@/components/ui/combobox';
import { useDebounce } from '@/hooks/use-debounce';
import { useProblems } from '@/context/problem-context';
import { useAuth } from '@/hooks/use-auth';
import type { Problem } from '@/lib/definitions';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';


const reportFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  location: z.string().min(1, 'Location is required.'),
  description: z.string().min(1, "Please provide a description.").max(500, 'Description must be 500 characters or less.'),
  department: z.string().min(1, 'Please select a department.'),
  issueType: z.string().min(1, 'Please select an issue type.'),
  media: z.any().optional(),
  voicemail: z.any().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function ReportForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addProblem, updateProblem } = useProblems();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingLocation, setIsSuggestingLocation] = useState(false);
  const [isSuggestingDepartment, setIsSuggestingDepartment] = useState(false);
  
  const [submittedProblem, setSubmittedProblem] = useState<Problem | null>(null);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [problemState, setProblemState] = useState<string | null>(null);


  // Camera and file state
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [mediaFile, setMediaFile] = useState<{file: File | null, preview: string | null}>({ file: null, preview: null });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: '',
      location: '',
      description: '',
      department: '',
      issueType: '',
    },
  });

  const locationValue = form.watch('location');
  const descriptionValue = form.watch('description');
  
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (showCamera) {
      const getCameraPermission = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions to use this feature.',
          });
          setShowCamera(false);
        }
      };

      getCameraPermission();

      return () => {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
      };
    }
  }, [showCamera, toast]);
  
  const handleCameraOpen = useCallback(() => {
    if (!locationValue) {
      toast({
        variant: 'destructive',
        title: 'Location Required',
        description: 'Please enter a location before taking a photo.',
      });
      return;
    }
    setMediaFile({ file: null, preview: null});
    setShowCamera(true);
  }, [locationValue, toast]);

  const dataUrlToFile = (dataUrl: string, filename: string): File | null => {
      const arr = dataUrl.split(',');
      if (arr.length < 2) { return null; }
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) { return null; }
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, {type:mime});
  }

  const compressImage = (imageFile: File, quality = 0.7): Promise<{ file: File, preview: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const compressedFile = dataUrlToFile(dataUrl, `compressed-${imageFile.name}`);

          if (compressedFile) {
            resolve({ file: compressedFile, preview: dataUrl });
          } else {
            reject(new Error("Failed to compress image."));
          }
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };
  
  const handleCapture = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        const { videoWidth, videoHeight } = video;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        context.drawImage(video, 0, 0, videoWidth, videoHeight);

        const location = form.getValues('location');
        const timestamp = new Date().toLocaleString();
        
        context.fillStyle = 'white';
        context.font = '16px Arial';
        context.shadowColor = 'black';
        context.shadowBlur = 4;

        const text = `${location} | ${timestamp}`;
        context.fillText(text, 10, videoHeight - 15);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Compress here
        const file = dataUrlToFile(dataUrl, `capture-${Date.now()}.jpg`);

        if (file) {
          setMediaFile({ file: file, preview: dataUrl });
          form.setValue('media', file);
          setShowCamera(false);
        }
      }
    }
  }, [form]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.type.startsWith('image/')) {
          try {
            toast({ title: 'Compressing image...', description: 'Please wait.' });
            const { file: compressedFile, preview } = await compressImage(file, 0.8);
            setMediaFile({ file: compressedFile, preview });
            form.setValue('media', compressedFile);
            toast({ title: 'Image compressed successfully!', description: `Original: ${(file.size / 1024).toFixed(1)} KB, Compressed: ${(compressedFile.size / 1024).toFixed(1)} KB` });
          } catch (error) {
            console.error("Image compression failed:", error);
            toast({ title: 'Compression Failed', description: 'Could not compress image, using original.', variant: 'destructive' });
            // Fallback to original file
            const previewUrl = URL.createObjectURL(file);
            setMediaFile({ file, preview: previewUrl });
            form.setValue('media', file);
          }
        } else {
          // For non-image files like videos, just use the original file
          const previewUrl = URL.createObjectURL(file);
          setMediaFile({ file, preview: previewUrl });
          form.setValue('media', file);
        }
    }
  }, [form, toast]);

  const clearMedia = useCallback(() => {
      if (mediaFile.preview && mediaFile.preview.startsWith('blob:')) {
          URL.revokeObjectURL(mediaFile.preview);
      }
      setMediaFile({ file: null, preview: null });
      form.setValue('media', null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  }, [mediaFile.preview, form]);

  const fetchAddressCompletions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    setIsFetchingSuggestions(true);
    const result = await getAddressCompletions(query);
    if (result.success && result.suggestions) {
      setLocationSuggestions(result.suggestions);
    }
    setIsFetchingSuggestions(false);
  }, []);

  const debouncedFetch = useDebounce(fetchAddressCompletions, 300);

  const handleLocationInputChange = (value: string) => {
    form.setValue('location', value);
    debouncedFetch(value);
    // Infer state from text
    const matchedState = indianStates.find(s => value.toLowerCase().includes(s.name.toLowerCase()));
    if (matchedState) {
        setProblemState(matchedState.name);
    }
  }
  
  let latitude = 0;
  let longitude = 0;

  const handleLocationSuggest = useCallback(() => {
    setIsSuggestingLocation(true);
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      });
      setIsSuggestingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        const result = await getLocationSuggestion({ latitude, longitude });
        if (result.success && result.locationName) {
          form.setValue('location', result.locationName);
          if (result.state) {
            setProblemState(result.state);
          }
          setLocationSuggestions([]);
          toast({
            title: 'Location Suggested!',
            description: `We've suggested a location based on your GPS.`,
          });
        } else {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
        }
        setIsSuggestingLocation(false);
      },
      (error) => {
        toast({
          title: 'Geolocation Error',
          description: 'Could not retrieve your location. Please ensure location services are enabled.',
          variant: 'destructive',
        });
        setIsSuggestingLocation(false);
      }
    );
  }, [form, toast]);
  
  const handleDepartmentSuggest = useCallback(async () => {
      if (!descriptionValue.trim()) {
          toast({
              title: 'Description Needed',
              description: 'Please enter a problem description before suggesting a department.',
              variant: 'destructive',
          });
          return;
      }
      
      setIsSuggestingDepartment(true);
      const result = await getDepartmentSuggestion(descriptionValue);
      if (result.success && result.suggestedDepartment) {
          form.setValue('department', result.suggestedDepartment);
          toast({
              title: 'Department Suggested!',
              description: `We've suggested the "${result.suggestedDepartment}".`,
          });
      } else {
          toast({
              title: 'Suggestion Failed',
              description: result.error,
              variant: 'destructive'
          });
      }
      setIsSuggestingDepartment(false);
  }, [descriptionValue, form, toast]);

  async function onSubmit(data: ReportFormValues) {
    if (user.type !== 'user') return;

    setIsSubmitting(true);
    
    // In a real app, you would upload mediaFile.file to Firebase Storage here
    // and get a downloadable URL. For now, we'll just use the preview.
    const imageUrl = mediaFile.preview ? mediaFile.preview : `new-report-${Date.now()}`;
    
    if (editingProblem) {
        // We are editing an existing problem
        const updatedProblemData: Partial<Problem> = {
            title: data.title,
            description: data.description,
            department: data.department,
            issueType: data.issueType,
            media: {
                ...editingProblem.media,
                images: [imageUrl], // update image
            },
        };

        await updateProblem(editingProblem.id, updatedProblemData);
        setSubmittedProblem({...editingProblem, ...updatedProblemData});
        setEditingProblem(null);
        setIsSubmitting(false);
        form.reset();
        clearMedia();
        return;
    }

    const finalState = problemState || 'Unknown';

    const newProblemData = {
      title: data.title,
      description: data.description,
      department: data.department,
      issueType: data.issueType,
      status: 'Awaiting Approval',
      location: {
        address: data.location,
        state: finalState,
        city: 'Unknown',
        coordinates: { lat: latitude, lng: longitude },
      },
      media: {
        images: [imageUrl],
        videos: [],
      },
      likes: 0,
      dislikes: 0,
    };

    const newProblem = await addProblem(newProblemData as any);
    if(newProblem) {
        setSubmittedProblem(newProblem);
    } else {
        toast({ title: "Failed to submit report", variant: "destructive" });
    }

    setIsSubmitting(false);
    form.reset();
    clearMedia();
    setProblemState(null);
  }
  
  const handleEditIssue = () => {
    if (!submittedProblem) return;
    setEditingProblem(submittedProblem);
    form.reset({
      title: submittedProblem.title,
      location: submittedProblem.location.address,
      description: submittedProblem.description,
      department: submittedProblem.department,
      issueType: submittedProblem.issueType,
    });
    if (submittedProblem.media.images.length > 0) {
        setMediaFile({ file: null, preview: submittedProblem.media.images[0] });
    }
    setSubmittedProblem(null);
  };
  
  if (submittedProblem) {
    return (
       <div className="text-center py-10 max-w-4xl mx-auto">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-3xl font-headline font-bold text-primary mb-2">Report Submitted Successfully!</h1>
            <p className="text-muted-foreground mb-8">
                Your civic issue has been recorded and will be reviewed by the appropriate department.
            </p>

            <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg text-left">
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Report ID</p>
                            <p className="font-semibold text-primary">{submittedProblem.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-semibold">Submitted</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Date & Time</p>
                            <p className="font-semibold">{format(new Date(submittedProblem.createdAt), 'PPpp')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Progress Status</p>
                            <p className="font-semibold flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
                                {submittedProblem.status}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                       <div>
                            <p className="text-sm text-muted-foreground">Category</p>
                            <p className="font-semibold">{submittedProblem.department}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Issue Type</p>
                            <p className="font-semibold">{submittedProblem.issueType}</p>
                        </div>
                         <div className="col-span-full">
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p className="font-semibold">{submittedProblem.description}</p>
                        </div>
                        <div className="col-span-full">
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-semibold">{submittedProblem.location.address}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Attachments</p>
                            <p className="font-semibold">{submittedProblem.media.images.length > 0 ? `${submittedProblem.media.images.length} file(s) uploaded` : 'None'}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Voice Note</p>
                            <p className="font-semibold">{submittedProblem.media.voicemail ? 'Provided' : 'Not provided'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className='mt-8 flex justify-center gap-4'>
                 <Button onClick={() => { setSubmittedProblem(null); setProblemState(null); }}>
                    <Sparkles className="w-4 h-4 mr-2" /> Report Another Issue
                </Button>
                <Button variant="outline" onClick={handleEditIssue}>
                    <Edit className="w-4 h-4 mr-2" /> Edit Issue
                </Button>
            </div>
        </div>
    )
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Title*</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. Massive Pothole on Main St" {...field} />
                </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Location*</FormLabel>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button type="button" variant="outline" onClick={handleLocationSuggest} disabled={isSuggestingLocation || !!editingProblem} className='sm:w-auto w-full'>
                  {isSuggestingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <MapPin className="h-4 w-4 mr-2" />} Use GPS
                </Button>
                <div className="flex items-center gap-4 w-full">
                  <span className="text-muted-foreground">Or</span>
                   <Combobox
                        items={locationSuggestions.map(s => ({label: s, value: s}))}
                        value={field.value}
                        onValueChange={handleLocationInputChange}
                        onSelect={(value) => {
                            form.setValue('location', value);
                            setLocationSuggestions([]);
                        }}
                        isLoading={isFetchingSuggestions}
                        placeholder="Enter address..."
                        disabled={!!editingProblem}
                    />
                </div>
              </div>
               {editingProblem && <FormDescription>Location cannot be edited after submission.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        
         <FormField
          control={form.control}
          name="media"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">File Upload & Camera</FormLabel>
               <FormDescription>Upload a file or take a picture with your camera.</FormDescription>
                <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Camera Box */}
                        <div className='border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4'>
                            <h3 className="font-semibold">Camera</h3>
                            <Camera className="w-10 h-10 text-muted-foreground"/>
                            <p className="font-medium">Take a photo</p>
                            <p className="text-sm text-muted-foreground">Use your camera to capture an image</p>
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div tabIndex={locationValue ? -1 : 0}>
                                            <Button type="button" onClick={handleCameraOpen} disabled={!locationValue}>
                                                <Camera className="w-4 h-4 mr-2"/> Start Camera
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    {!locationValue && (
                                        <TooltipContent>
                                            <p>Please enter a location first.</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        {/* File Upload Box */}
                        <div className='relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4'>
                             <Input 
                              type="file" 
                              accept="image/*,video/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                            />
                            <h3 className="font-semibold">File Upload</h3>
                             <FileUp className="w-10 h-10 text-muted-foreground"/>
                            <p className="font-medium">Drop your file here, or browse</p>
                            <p className="text-sm text-muted-foreground">Supports images and videos</p>
                        </div>
                    </div>
                </FormControl>
                {mediaFile.preview && (
                    <div className="mt-4 border rounded-lg p-4 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                           {mediaFile.preview && (
                                <Image src={mediaFile.preview} alt="preview" width={60} height={45} className="rounded-md object-cover" />
                           )}
                           <div>
                                <p className="text-sm font-medium">{mediaFile.file ? mediaFile.file.name : 'Image Preview'}</p>
                               {mediaFile.file && <p className="text-xs text-muted-foreground">{(mediaFile.file.size / 1024).toFixed(2)} KB</p>}
                           </div>
                       </div>
                       <Button variant="ghost" size="icon" onClick={clearMedia}>
                           <X className="w-4 h-4" />
                       </Button>
                    </div>
                )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
           <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Problem Description*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail. Include when you noticed it, how it affects you or others, and any other relevant information..."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
                 <h3 className="text-lg font-medium">Voice Message (Optional)</h3>
                 <div className="flex items-center justify-center w-full h-full p-4 border-2 border-dashed rounded-lg min-h-[140px]">
                    <Button type="button" variant="outline">
                        <Mic className="w-4 h-4 mr-2" /> Record Voice Note
                    </Button>
                 </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-lg">Department Category*</FormLabel>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button type="button" variant="outline" className='sm:w-auto w-full' onClick={handleDepartmentSuggest} disabled={isSuggestingDepartment}>
                            {isSuggestingDepartment ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Sparkles className="h-4 w-4 mr-2" />} Suggest
                        </Button>
                        <div className="flex items-center gap-4 w-full">
                            <span className="text-muted-foreground">Or</span>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a department" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {departments.map(dept => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                </div>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="issueType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-lg">Issue Type*</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select an issue type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Frequent Power Cuts">Frequent Power Cuts</SelectItem>
                                <SelectItem value="Broken Streetlight">Broken Streetlight</SelectItem>
                                <SelectItem value="Damaged Transformer">Damaged Transformer</SelectItem>
                                <SelectItem value="Billing Issue">Billing Issue</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    <FormMessage />
                    </FormItem>
                )}
             />
        </div>


        <div className='flex justify-end gap-4'>
            {editingProblem && (
                <Button type="button" variant="outline" onClick={() => setEditingProblem(null)}>
                    Cancel
                </Button>
            )}
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProblem ? 'Update Report' : 'Submit Report'}
            </Button>
        </div>
      </form>
    </Form>
    <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Live Camera</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {hasCameraPermission === false && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  Please enable camera permissions in your browser settings to use this feature.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCamera(false)}>Cancel</Button>
            <Button onClick={handleCapture} disabled={!hasCameraPermission}>
              <Camera className="mr-2 h-4 w-4" />
              Capture Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
