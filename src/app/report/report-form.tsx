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
import { useState } from 'react';
import { Camera, FileVideo, Loader2, MapPin, Mic, UploadCloud } from 'lucide-react';
import { getLocationSuggestion } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

const reportFormSchema = z.object({
  location: z.string().min(1, 'Location is required.'),
  description: z.string().min(1, "Please provide a description.").max(500, 'Description must be 500 characters or less.'),
  media: z.any().optional(),
  voicemail: z.any().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;


export default function ReportForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingLocation, setIsSuggestingLocation] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      location: '',
      description: '',
    },
  });

  const handleLocationSuggest = async () => {
    setIsSuggestingLocation(true);
    const result = await getLocationSuggestion();
    if (result.success && result.locationName) {
      form.setValue('location', result.locationName);
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
  };
  
  function onSubmit(data: ReportFormValues) {
    setIsSubmitting(true);
    console.log(data);
    setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        form.reset();
        setFileCount(0);
    }, 2000);
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
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Report Another Issue
                </Button>
            </div>
        </Alert>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                   <FormControl>
                    <Input placeholder="Enter address or coordinates" {...field} />
                   </FormControl>
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
              <FormLabel className="text-lg">Upload Images, Videos or Documents*</FormLabel>
                <FormControl>
                    <div className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg">
                        <div className="flex flex-col items-center justify-center space-y-2">
                             <div className="flex gap-4 text-muted-foreground">
                                <Camera className="w-8 h-8" />
                                <FileVideo className="w-8 h-8" />
                            </div>
                            <p className="text-sm text-muted-foreground">Click or drag & drop to upload (Up to 5 files)</p>
                            <Button type="button" variant="secondary" size="sm">
                                <UploadCloud className="w-4 h-4 mr-2"/> Choose Files
                            </Button>
                        </div>
                        <Input 
                          type="file" 
                          multiple 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => { field.onChange(e.target.files); setFileCount(e.target.files?.length || 0); }}
                        />
                    </div>
                </FormControl>
              <FormDescription>Accepted types: .jpg, .png, .gif, .pdf, .txt, .docx, .mp4, .mov. {fileCount > 0 && `${fileCount} files selected.`}</FormDescription>
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

        <div className='flex justify-end'>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
        </div>
      </form>
    </Form>
  );
}
