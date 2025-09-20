"use client";

import { useState } from 'react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { indianStates, mockProblems } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Clock, FileText, Globe, MapPin, AlertTriangle, Building, Recycle, Lightbulb, Waves, Trees } from 'lucide-react';

const departmentIcons: { [key: string]: React.ReactNode } = {
    'Public Works Department': <Building className="w-8 h-8 text-primary" />,
    'Sanitation Department': <Recycle className="w-8 h-8 text-primary" />,
    'Electricity Department': <Lightbulb className="w-8 h-8 text-primary" />,
    'Water Supply Department': <Waves className="w-8 h-8 text-primary" />,
    'Parks and Recreation': <Trees className="w-8 h-8 text-primary" />,
  };

export default function DashboardClient() {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const problemsInState = selectedState
    ? mockProblems.filter((p) => p.location.state === selectedState)
    : [];

  const solvedProblems = problemsInState.filter(p => p.status === 'Resolved').length;
  const reportedProblems = problemsInState.length;

  const departmentCategories = Array.from(new Set(mockProblems.map(p => p.department)));

  return (
    <main className="flex-1">
      <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Track civic issues and progress across states. Select your state to explore local accountability data.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
             <CardHeader className="flex-row items-center gap-4">
                <Globe className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle className="text-xl">Select Your State or Union Territory</CardTitle>
                    <CardDescription>Choose from {indianStates.length} states and union territories to view local civic issues.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
              <Select onValueChange={setSelectedState}>
                <SelectTrigger className="w-full h-12 text-lg bg-background/50">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((state) => (
                    <SelectItem key={state.code} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-card/80 backdrop-blur-sm border-border/20">
                <CardHeader className="flex-row justify-between items-center">
                    <CardTitle>Problems Reported</CardTitle>
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{selectedState ? reportedProblems : '--'}</p>
                </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm border-border/20">
                <CardHeader className="flex-row justify-between items-center">
                    <CardTitle>Problems Solved</CardTitle>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{selectedState ? solvedProblems : '--'}</p>
                </CardContent>
            </Card>
        </div>


        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-headline font-bold">Civic Issue Categories</h2>
                <p className="text-muted-foreground">Explore different categories of civic issues reported by citizens.</p>
            </div>
            {selectedState ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {departmentCategories.map((department) => {
                        const problems = problemsInState.filter(p => p.department === department);
                        return (
                            <Card key={department} className="bg-card/80 backdrop-blur-sm border-border/20 p-6 flex flex-col items-center text-center">
                                {departmentIcons[department] || <FileText className="w-8 h-8 text-primary" />}
                                <h3 className="text-lg font-semibold mt-4">{department.replace(' Department', '')}</h3>
                                <p className="text-3xl font-bold my-2">{problems.length}</p>
                                <p className="text-sm text-muted-foreground">Reports</p>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card className="bg-card/80 backdrop-blur-sm border-border/20 text-center py-16">
                    <CardHeader>
                        <CardTitle>Select a State</CardTitle>
                        <CardDescription>Please select a state to view issue categories.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
      </div>
    </main>
  );
}
