import { toast } from '@/components/ui/use-toast';
import { createRequest } from '../actions';


interface CreateRequestParams {
  formData: FormData;
  imageUrl?: string | File;
}

const createRequestFitrii = async ({ formData, imageUrl }: CreateRequestParams) => {
  try {
    // If you have an image, add it to the FormData
    if (imageUrl) {
      if (typeof imageUrl === 'string') {
        formData.append('imageUrl', imageUrl);
      } else if (imageUrl instanceof File) {
        formData.append('imageUrl', imageUrl, imageUrl.name);
      }
    }
    
    // Perform the form submission
    await createRequest(formData);
    
    // Show a success toast notification
    toast({
      title: "Request Created",
      description: "Your request has been successfully created.",
      variant: "default",
    });
  } catch (error) {
    // Handle any errors that occur during the form submission
    console.error("Error creating request:", error);
    
    // Show an error toast notification
    toast({
      title: "Error",
      description: "An error occurred while creating your request. Please try again.",
      variant: "destructive",
    });
  }
};

export default createRequestFitrii;