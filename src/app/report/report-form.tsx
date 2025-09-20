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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Camera, FileVideo, Loader2, MapPin, Mic, UploadCloud } from 'lucide-react';
import { getLocationSuggestion } from './actions';

const reportFormSchema = z.object({
  location: z.string().min(1, 'Location is required.'),
  department: z.string().min(1, 'Please select a department.'),
  issueType: z.string().min(1, 'Please select an issue type.'),
  description: z.string().max(500, 'Description must be 100 words or less.').optional(),
  photos: z.any().optional(),
  videos: z.any().optional(),
  voicemail: z.any().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

const departments = [
  'Public Works Department',
  'Sanitation Department',
  'Electricity Department',
  'Water Supply Department',
  'Parks and Recreation',
];
const issueTypes = ['Roads & Streets', 'Waste Management', 'Streetlights', 'Water & Sewage', 'Public Spaces'];

export default function ReportForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingLocation, setIsSuggestingLocation] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      location: '',
      department: '',
      issueType: '',
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
        toast({
          title: 'Report Submitted!',
          description: 'Your report has been sent to an administrator for review. Thank you!',
        });
        form.reset();
        setPhotoCount(0);
        setVideoCount(0);
    }, 2000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Location (Mandatory)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="e.g., Connaught Place, New Delhi" {...field} />
                </FormControl>
                <Button type="button" variant="outline" onClick={handleLocationSuggest} disabled={isSuggestingLocation}>
                  {isSuggestingLocation ? <Loader2 className="h-4 w-4 animate-spin"/> : <MapPin className="h-4 w-4" />}
                </Button>
              </div>
              <FormDescription>
                Point out the area or use GPS for an AI-powered suggestion.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Civic Service Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issueType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Issue Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an issue type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {issueTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="space-y-4 rounded-lg border p-4">
            <h3 className="text-lg font-medium">Upload Media</h3>
            <p className="text-sm text-muted-foreground">Photos and videos help departments understand the issue better. Media will be compressed for efficiency.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="photos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Camera/> Photos (up to 15)</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" multiple onChange={(e) => { field.onChange(e.target.files); setPhotoCount(e.target.files?.length || 0); }} />
                      </FormControl>
                      <FormDescription>{photoCount} photos selected.</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="videos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><FileVideo/> Videos (up to 5)</FormLabel>
                      <FormControl>
                        <Input type="file" accept="video/*" multiple onChange={(e) => { field.onChange(e.target.files); setVideoCount(e.target.files?.length || 0); }}/>
                      </FormControl>
                      <FormDescription>{videoCount} videos selected.</FormDescription>
                    </FormItem>
                  )}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little more about the problem (approx. 100 words)"
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
                 <h3 className="text-lg font-medium flex items-center gap-2"><Mic /> Voicemail (Optional)</h3>
                 <div className="flex items-center justify-center w-full h-full p-4 border-2 border-dashed rounded-lg">
                    <Button type="button" variant="outline">
                        Record Voicemail
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
