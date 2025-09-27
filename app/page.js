'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Login from './components/Login';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import MeetingDetails from './components/MeetingDetails';
import SpaceManager from './components/SpaceManager';

export default function Home() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Login />;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Meeting Insights AI</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Logout
        </button>
      </div>

      <Tabs>
        <TabList>
          <Tab>Meeting Details</Tab>
          <Tab>Space Management</Tab>
        </TabList>

        <TabPanel>
          <MeetingDetails />
        </TabPanel>
        <TabPanel>
          <SpaceManager />
        </TabPanel>
      </Tabs>
    </div>
  );
}
