
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
import { Camera, FileVideo, Loader2, MapPin, Mic, Sparkles, UploadCloud, Video, X } from 'lucide-react';
import { getLocationSuggestion, getDepartmentSuggestion, getAddressCompletions } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
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


const reportFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  location: z.string().min(1, 'Location is required.'),
  description: z.string().min(1, "Please provide a description.").max(500, 'Description must be 500 characters or less.'),
  department: z.string().min(1, 'Please select a department.'),
  media: z.any().optional(),
  voicemail: z.any().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;


export default function ReportForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addProblem } = useProblems();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingLocation, setIsSuggestingLocation] = useState(false);
  const [isSuggestingDepartment, setIsSuggestingDepartment] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
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
    },
  });
  
  useEffect(() => {
    if (showCamera) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
          if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
          }
      };
    }
  }, [showCamera, toast]);
  
  const handleCameraOpen = () => {
    const location = form.getValues('location');
    if (!location) {
      toast({
        variant: 'destructive',
        title: 'Location Required',
        description: 'Please enter a location before taking a photo.',
      });
      return;
    }
    setCapturedImage(null);
    setShowCamera(true);
  };
  
  const handleCapture = () => {
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
        context.font = '20px Arial';
        context.shadowColor = 'black';
        context.shadowBlur = 5;

        const text = `${location} | ${timestamp}`;
        context.fillText(text, 10, videoHeight - 20);

        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        form.setValue('media', dataUrl);
        setShowCamera(false);
      }
    }
  };

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

  const debouncedFetch = useDebounce(fetchAddressCompletions, 500);

  const handleLocationInputChange = (value: string) => {
    form.setValue('location', value);
    debouncedFetch(value);
  }
  
  let latitude = 0;
  let longitude = 0;

  const handleLocationSuggest = () => {
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
  };
  
  const handleDepartmentSuggest = async () => {
      const description = form.getValues('description');
      if (!description.trim()) {
          toast({
              title: 'Description Needed',
              description: 'Please enter a problem description before suggesting a department.',
              variant: 'destructive',
          });
          return;
      }
      
      setIsSuggestingDepartment(true);
      const result = await getDepartmentSuggestion(description);
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
  }

  function onSubmit(data: ReportFormValues) {
    if (user.type !== 'user') return;

    setIsSubmitting(true);

    const randomState = indianStates[Math.floor(Math.random() * indianStates.length)];

    const newProblem: Problem = {
      id: `prob-${Date.now()}`,
      title: data.title,
      description: data.description,
      department: data.department,
      issueType: 'General',
      status: 'Awaiting Approval',
      location: {
        state: randomState.name,
        city: 'Unknown',
        coordinates: { lat: latitude, lng: longitude },
      },
      media: {
        images: capturedImage ? [capturedImage] : [`new-report-${Date.now()}`],
        videos: [],
      },
      likes: 0,
      reportedBy: {
        id: user.data.id,
        name: user.data.name,
        avatarUrl: user.data.avatarUrl,
      },
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
        addProblem(newProblem);
        setIsSubmitting(false);
        setSubmitted(true);
        form.reset();
        setFileCount(0);
        setCapturedImage(null);
    }, 1000);
  }
  
  if (submitted) {
    return (
        <Alert className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg text-center py-10">
            <AlertTitle className="text-2xl font-headline text-primary">Report Submitted Successfully!</AlertTitle>
            <AlertDescription className="mt-2 text-lg">
                Thank you for helping improve your community. Your report is under review.
            </AlertDescription>
            <div className='mt-6 flex justify-center gap-4'>
                 <Button asChild>
                    <Link href="/profile">View My Reports</Link>
                </Button>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Report Another Issue
                </Button>
            </div>
        </Alert>
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
                <Button type="button" variant="outline" onClick={handleLocationSuggest} disabled={isSuggestingLocation} className='sm:w-auto w-full'>
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
                    />
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
         <FormField
          control={form.control}
          name="media"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Upload Images or Videos*</FormLabel>
                <FormControl>
                    <div className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg">
                        {capturedImage ? (
                            <div className="relative">
                                <Image src={capturedImage} alt="Captured report" width={200} height={150} className="rounded-md object-contain"/>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                                  onClick={() => {
                                      setCapturedImage(null);
                                      form.setValue('media', null);
                                      if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                      }
                                      setFileCount(0);
                                  }}
                                >
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        ) : (
                          <>
                           <Input 
                              ref={fileInputRef}
                              type="file" 
                              multiple 
                              accept="image/*,video/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => { 
                                field.onChange(e.target.files); 
                                setFileCount(e.target.files?.length || 0); 
                                if (e.target.files && e.target.files.length > 0) {
                                  setCapturedImage(URL.createObjectURL(e.target.files[0]));
                                } else {
                                  setCapturedImage(null);
                                }
                              }}
                            />
                            <div className="flex flex-col items-center justify-center space-y-2 text-center">
                                <div className="flex gap-4 text-muted-foreground">
                                    <UploadCloud className="w-8 h-8" />
                                    <FileVideo className="w-8 h-8" />
                                </div>
                                <p className="text-sm text-muted-foreground">Click or drag & drop to upload (Up to 5 files)</p>
                                <div className="flex gap-4 items-center">
                                  <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                      <UploadCloud className="w-4 h-4 mr-2"/> Choose Files
                                  </Button>
                                  <span className="text-muted-foreground">or</span>
                                   <Button type="button" variant="secondary" size="sm" onClick={handleCameraOpen}>
                                      <Camera className="w-4 h-4 mr-2"/> Use Camera
                                  </Button>
                                </div>
                            </div>
                          </>
                        )}
                    </div>
                </FormControl>
              <FormDescription>
                {fileCount > 0 ? `${fileCount} files selected.` : 'Accepted types: .jpg, .png, .mp4, .mov.'}
              </FormDescription>
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

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Department Category*</FormLabel>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button type="button" variant="outline" className='sm:w-auto w-full' onClick={handleDepartmentSuggest} disabled={isSuggestingDepartment}>
                         {isSuggestingDepartment ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Sparkles className="h-4 w-4 mr-2" />} Suggest Department
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

        <div className='flex justify-end'>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
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

    

    