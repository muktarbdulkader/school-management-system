from django.db import models
import uuid

class BlogCategories(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)  # e.g., "School Events", "Parent Resources"
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class BlogPosts(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='blog_posts')
    category = models.ForeignKey(BlogCategories, on_delete=models.SET_NULL, null=True, related_name='posts')
    published_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)
    
    # New fields for enhanced blog functionality
    POST_TYPE_CHOICES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
    ]
    post_type = models.CharField(max_length=10, choices=POST_TYPE_CHOICES, default='normal')
    event_date = models.DateField(null=True, blank=True)
    image = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.title

class BlogComments(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(BlogPosts, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='blog_comments')
    content = models.TextField()
    created_date = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"Comment on {self.post.title} by {self.author.full_name if self.author else 'Unknown'}"
