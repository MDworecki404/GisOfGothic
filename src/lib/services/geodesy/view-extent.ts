/** Co widać w widoku 2D: środek ekranu w metrach od kotwicy świata, skala i rozmiar płótna. */
export interface ViewExtent {
	centreEastMetres: number;
	centreNorthMetres: number;
	metresPerPixel: number;
	widthPixels: number;
	heightPixels: number;
}
