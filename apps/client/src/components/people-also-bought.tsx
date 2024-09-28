import { useEffect, useState } from "react";
import axios from "../lib/axios";
import {toast} from "sonner";
import LoadingSpinner from "./loading-spinner";
import ProductCard from "./products/product-card";

const PeopleAlsoBought = () => {
	const [recommendations, setRecommendations] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchRecommendations = async () => {
			try {
				setIsLoading(true);
				const res = await axios("/products/recommendations");
				console.log("Running", res.data, res.status, res.statusText);
				
				setRecommendations(res.data);
			} catch (error:any) {
				toast.error(error.response.data.message || "An error occurred while fetching recommendations");
				setRecommendations([]);
			} finally {
				setIsLoading(false);
			}
		};
		fetchRecommendations();
	}, []);

	if (isLoading) return <LoadingSpinner />;

	return (
		<div className='mt-8'>
			<h3 className='text-2xl font-semibold text-emerald-400'>People also bought</h3>
			<div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg: grid-col-3'>
				{recommendations.map((product:any) => (
					<ProductCard key={product._id} product={product} />
				))}
			</div>
		</div>
	);
};
export default PeopleAlsoBought;