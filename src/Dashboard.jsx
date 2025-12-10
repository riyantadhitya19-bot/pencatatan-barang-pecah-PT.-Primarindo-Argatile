import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Plus, Trash2, Search, Calendar, User, Package, Upload, Image as ImageIcon, X, Download, FileText, FileSpreadsheet, BarChart3, Home } from 'lucide-react'
import { supabase } from './supabaseClient'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const MERK_OPTIONS = [
  'OCTAGON',
  'VALENCIA',
  'ARLES',
  'MANDALAY',
  'PRIMATILES',
  'ARGA INDOTILE',
  'VANDAN',
  'VENETAS',
  'YUKA',
  'MAGNETO',
  'MIXED RIMPIL'
]

const REPORTER_OPTIONS = [
  'ASEP PEDIANTO',
  'ENDANG KURNIAWAN',
  'JAHUDI',
  'RAMIN'
]

