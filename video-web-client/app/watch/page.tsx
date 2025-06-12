'use client';
import { Inter } from 'next/font/google'
import {useSearchParams} from 'next/navigation'
import styles from "./watchpage.module.css";
import {Suspense} from "react";

const inter = Inter({ subsets: ['latin'] })


function Watchs() {
    const videoPrefix = 'https://storage.googleapis.com/dillon-processed-vids/';
    const videoSrc = useSearchParams().get('v');
    return (
        <div>
            <h1 className={inter.className}>Watch Page</h1>
            { <video className = {styles.video} controls src={videoPrefix + videoSrc}/> }
        </div>
    );
}

export default function Watch() {
    return (
        <Suspense>
            <Watchs />
        </Suspense>
    )
}