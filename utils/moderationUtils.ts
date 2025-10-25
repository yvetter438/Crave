/**
 * Moderation Utilities
 * Functions for approving and managing user-generated content
 */

import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

interface ApprovalResult {
  success: boolean;
  message: string;
  error?: any;
}

/**
 * Approve a post and move its video from private to public bucket
 * 
 * This function:
 * 1. Downloads video from private 'videos' bucket
 * 2. Uploads to public 'posts-videos' bucket
 * 3. Updates post with new URL and status='approved'
 * 4. Deletes from private bucket (cleanup)
 * 
 * @param postId - The ID of the post to approve
 * @returns Promise with success status and message
 */
export async function approvePostAndMoveVideo(postId: number): Promise<ApprovalResult> {
  try {
    console.log(`📋 Starting approval process for post ${postId}...`);

    // Step 1: Get the post details
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, video_url, status, user')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return {
        success: false,
        message: `Failed to fetch post: ${fetchError?.message || 'Post not found'}`,
        error: fetchError,
      };
    }

    // Check if already approved
    if (post.status === 'approved') {
      return {
        success: true,
        message: 'Post is already approved',
      };
    }

    const oldVideoPath = post.video_url;

    // If video is already a full URL, just update status
    if (oldVideoPath.startsWith('http')) {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ status: 'approved' })
        .eq('id', postId);

      if (updateError) {
        return {
          success: false,
          message: `Failed to update post status: ${updateError.message}`,
          error: updateError,
        };
      }

      return {
        success: true,
        message: 'Post approved (video already in public bucket)',
      };
    }

    console.log(`📥 Copying video from private to public bucket: ${oldVideoPath}`);

    // Step 2: Generate new filename (simpler structure for public bucket)
    // Extract just the filename from the path
    const fileName = oldVideoPath.split('/').pop() || `video_${postId}.mp4`;
    const newVideoPath = `${fileName}`;

    console.log(`📤 Getting signed URL from private bucket...`);

    // Step 3: Get the file from private bucket using signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('videos')
      .createSignedUrl(oldVideoPath, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return {
        success: false,
        message: `Failed to get signed URL: ${signedUrlError?.message}`,
        error: signedUrlError,
      };
    }

    console.log(`📥 Downloading video to temporary location...`);

    // Step 4: Download video to temp location using expo-file-system
    const tempFilePath = `${FileSystem.cacheDirectory}temp_video_${postId}.mp4`;
    
    try {
      const downloadResult = await FileSystem.downloadAsync(
        signedUrlData.signedUrl,
        tempFilePath
      );

      if (!downloadResult.uri) {
        throw new Error('Download failed - no URI returned');
      }

      console.log(`✅ Downloaded to: ${downloadResult.uri}`);
      console.log(`📤 Reading file and uploading to public bucket...`);

      // Step 5: Read the file as base64
      const fileInfo = await FileSystem.getInfoAsync(tempFilePath);
      if (!fileInfo.exists) {
        throw new Error('Downloaded file not found');
      }

      const base64Data = await FileSystem.readAsStringAsync(tempFilePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array for upload
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log(`📤 Uploading ${bytes.length} bytes to public bucket...`);

      // Step 6: Upload to public bucket
      const { error: uploadError } = await supabase.storage
        .from('posts-videos')
        .upload(newVideoPath, bytes, {
          contentType: 'video/mp4',
          upsert: false,
        });

      // Clean up temp file
      await FileSystem.deleteAsync(tempFilePath, { idempotent: true });

      if (uploadError) {
        throw uploadError;
      }
    } catch (downloadError: any) {
      // Clean up temp file if it exists
      try {
        await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
      } catch {}

      return {
        success: false,
        message: `Failed to transfer video: ${downloadError.message}`,
        error: downloadError,
      };
    }

    console.log(`✅ Video uploaded to public bucket: ${newVideoPath}`);

    // Step 7: Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('posts-videos')
      .getPublicUrl(newVideoPath);

    const newVideoUrl = publicUrlData.publicUrl;

    console.log(`🔄 Updating post with new URL and approved status...`);

    // Step 8: Update post with new URL and approved status
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        video_url: newVideoUrl,
        status: 'approved',
      })
      .eq('id', postId);

    if (updateError) {
      // If update fails, try to clean up the uploaded file
      await supabase.storage.from('posts-videos').remove([newVideoPath]);
      
      return {
        success: false,
        message: `Failed to update post: ${updateError.message}`,
        error: updateError,
      };
    }

    console.log(`🗑️ Cleaning up private bucket...`);

    // Step 9: Delete from private bucket (cleanup)
    const { error: deleteError } = await supabase.storage
      .from('videos')
      .remove([oldVideoPath]);

    if (deleteError) {
      console.warn(`⚠️ Warning: Failed to delete from private bucket: ${deleteError.message}`);
      // Don't fail the whole operation if cleanup fails
    }

    console.log(`🎉 Post ${postId} approved successfully!`);

    return {
      success: true,
      message: `Post approved successfully! Video moved to public bucket.`,
    };

  } catch (error: any) {
    console.error('❌ Error in approval process:', error);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      error,
    };
  }
}

/**
 * Approve multiple posts at once
 * 
 * @param postIds - Array of post IDs to approve
 * @returns Promise with results for each post
 */
export async function approveBatchPosts(postIds: number[]): Promise<{
  successful: number[];
  failed: Array<{ postId: number; reason: string }>;
}> {
  const successful: number[] = [];
  const failed: Array<{ postId: number; reason: string }> = [];

  console.log(`📦 Starting batch approval for ${postIds.length} posts...`);

  for (const postId of postIds) {
    const result = await approvePostAndMoveVideo(postId);
    
    if (result.success) {
      successful.push(postId);
    } else {
      failed.push({ postId, reason: result.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`✅ Batch complete: ${successful.length} approved, ${failed.length} failed`);

  return { successful, failed };
}

/**
 * Remove a post and delete its video
 * 
 * @param postId - The ID of the post to remove
 * @param reason - Reason for removal
 * @returns Promise with success status and message
 */
export async function removePost(postId: number, reason: string): Promise<ApprovalResult> {
  try {
    console.log(`🚫 Removing post ${postId}...`);

    // Get post details
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, video_url, status')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return {
        success: false,
        message: `Failed to fetch post: ${fetchError?.message || 'Post not found'}`,
        error: fetchError,
      };
    }

    // Update post status to removed
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'removed',
        removed_at: new Date().toISOString(),
        removed_reason: reason,
      })
      .eq('id', postId);

    if (updateError) {
      return {
        success: false,
        message: `Failed to update post status: ${updateError.message}`,
        error: updateError,
      };
    }

    // Optionally delete video from storage
    // (You might want to keep it for audit purposes)
    const videoPath = post.video_url;
    if (!videoPath.startsWith('http')) {
      // It's a path, delete from private bucket
      await supabase.storage.from('videos').remove([videoPath]);
    }

    console.log(`✅ Post ${postId} removed successfully`);

    return {
      success: true,
      message: `Post removed successfully. Reason: ${reason}`,
    };

  } catch (error: any) {
    console.error('❌ Error removing post:', error);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      error,
    };
  }
}

/**
 * Get all pending posts for review
 * 
 * @param limit - Maximum number of posts to fetch
 * @returns Promise with array of pending posts
 */
export async function getPendingPosts(limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        created_at,
        description,
        video_url,
        status,
        user
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching pending posts:', error);
      return { posts: [], error };
    }

    return { posts: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { posts: [], error };
  }
}

