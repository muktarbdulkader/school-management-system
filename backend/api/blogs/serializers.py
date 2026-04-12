from rest_framework import serializers
from .models import BlogCategories, BlogPosts, BlogComments

class BlogCategoriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategories
        fields = '__all__'

class BlogCommentsSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()
    class Meta:
        model = BlogComments
        fields = '__all__'

class BlogPostsSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=BlogCategories.objects.all(),
        allow_null=True,
        required=False
    )
    category_details = BlogCategoriesSerializer(source='category', read_only=True)
    comments = BlogCommentsSerializer(many=True, read_only=True)

    class Meta:
        model = BlogPosts
        fields = '__all__'