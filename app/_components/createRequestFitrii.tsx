const createRequestFitrii = async (formData: FormData) => {
  try {
    // If you have an image, the imageUrl will now be a local path
    if (imageUrl) {
      formData.append('imageUrl', imageUrl);
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